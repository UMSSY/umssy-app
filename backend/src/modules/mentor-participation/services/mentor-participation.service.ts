import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import type { Prisma } from '../../../prisma/client.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../availability/constants/appointment-status.constants.js';
import type { ParticipationPreferencesDto } from '../requests/participation-preferences.schema.js';
import { mentorCapacity } from './mentor-capacity.js';
import { mentorAbusePolicy, sanctionRetryAfter } from './mentor-abuse-policy.js';

type Tx = Prisma.TransactionClient;
type EventType = 'WAITING' | 'OFFERED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
type IntakeOutcome = { statusCode: number; outcome: string; data: Record<string, unknown>; detail?: string };
const DAY_MS = 24 * 60 * 60 * 1000;

class ParticipationException extends DomainException {
  constructor(message: string, statusCode = 409, data: unknown = null, retryAfterSeconds?: number) {
    super(message, statusCode, data, retryAfterSeconds);
  }
}

@Injectable()
export class MentorParticipationService {
  constructor(private readonly prisma: PrismaService) {}

  static requireIdempotencyKey(key: string | undefined): string {
    if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      throw new ParticipationException('Envía un Idempotency-Key UUID para registrar la solicitud', 400, { code: 'IDEMPOTENCY_KEY_REQUIRED' });
    }
    return key.toLowerCase();
  }

  private async intake(userId: string, data: ParticipationPreferencesDto, key: string,
    action: 'REQUEST' | 'ACTIVATE', operation: (tx: Tx, now: Date, email: string) => Promise<IntakeOutcome>) {
    const policy = mentorAbusePolicy();
    const payloadHash = createHash('sha256').update(JSON.stringify({ action,
      technicalAreaIds: [...data.technicalAreaIds].sort(), orientationTypeIds: [...data.orientationTypeIds].sort() })).digest('hex');
    const result = await this.transaction(async (tx, now): Promise<IntakeOutcome> => {
      const previous = await tx.mentorParticipationAttempt.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: key } } });
      if (previous) {
        if (previous.payloadHash !== payloadHash) return { statusCode: 409, outcome: 'KEY_REUSED',
          detail: 'La clave de idempotencia ya se usó con otro contenido', data: { code: 'IDEMPOTENCY_KEY_REUSED' } };
        return { statusCode: previous.statusCode, outcome: previous.outcome, detail: previous.detail ?? undefined,
          data: previous.response as Record<string, unknown> };
      }
      const [activeSanction] = await tx.$queryRaw<{ startsAt: Date; expiresAt: Date }[]>`
        SELECT starts_at AS "startsAt", expires_at AS "expiresAt"
        FROM mentor_participation_sanctions
        WHERE user_id = ${userId}::uuid AND lifted_at IS NULL AND expires_at > clock_timestamp()
        ORDER BY expires_at DESC LIMIT 1`;
      const suspended = (expiresAt: Date): IntakeOutcome => ({ statusCode: 429, outcome: 'SUSPENDED',
        detail: 'Las nuevas solicitudes de mentoría están suspendidas temporalmente',
        data: { code: 'MENTOR_REQUEST_SUSPENDED', sanctionEndsAt: expiresAt.toISOString() } });
      if (activeSanction) return suspended(activeSanction.expiresAt);
      const user = await this.assertEligible(tx, userId, now);
      await this.assertPreferences(tx, data);
      const [{ total: recent }] = await tx.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total FROM mentor_participation_attempts
        WHERE user_id = ${userId}::uuid AND counted = true
          AND occurred_at > clock_timestamp() - (${policy.windowHours} * INTERVAL '1 hour')
          AND occurred_at <= clock_timestamp()`;
      let outcome: IntakeOutcome;
      if (Number(recent) + 1 >= policy.threshold) {
        const expiresAt = new Date(now.getTime() + policy.sanctionHours * 3_600_000);
        const sanction = await tx.mentorParticipationSanction.create({ data: {
          userId, reason: 'FIVE_ATTEMPTS_IN_24_HOURS', startsAt: now, expiresAt,
        } });
        await tx.mentorEmailOutbox.create({ data: { eventKey: `sanction:${sanction.id}`, recipient: user.email,
          type: 'SANCTION', payload: { startsAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
            appUrl: `${process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:3000'}/mentors/participation` } } });
        outcome = suspended(expiresAt);
        outcome.outcome = 'SANCTIONED';
      } else {
        await this.expireAndFill(tx, now);
        outcome = await operation(tx, now, user.email);
      }
      await tx.mentorParticipationAttempt.create({ data: { userId, idempotencyKey: key, payloadHash,
        action, outcome: outcome.outcome, counted: true, statusCode: outcome.statusCode,
        detail: outcome.detail, response: outcome.data as Prisma.InputJsonValue, occurredAt: now } });
      return outcome;
    });
    if (result.statusCode >= 400) {
      const expiry = result.data.sanctionEndsAt;
      throw new ParticipationException(result.detail ?? 'No se pudo registrar la solicitud', result.statusCode,
        result.data, typeof expiry === 'string' ? sanctionRetryAfter(new Date(expiry), new Date()) : undefined);
    }
    return result.data;
  }

  private transaction<T>(operation: (tx: Tx, now: Date) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
      await tx.$queryRaw`SELECT id FROM mentor_capacity_policies WHERE id = 'GLOBAL' FOR UPDATE`;
      const policy = await tx.mentorCapacityPolicy.findUnique({ where: { id: 'GLOBAL' } });
      if (!policy) throw new ParticipationException('Falta la política global de cupos', 500);
      return operation(tx, new Date());
    }, { maxWait: 10_000, timeout: 30_000 });
  }

  private async capacityIn(tx: Tx, now: Date) {
    const policy = await tx.mentorCapacityPolicy.findUniqueOrThrow({ where: { id: 'GLOBAL' } });
    const approvedGraduates = await tx.user.count({ where: {
      isActive: true,
      roles: { some: { deletedAt: null, startAt: { lte: now }, role: { name: 'titulado' } } },
      approvedAccessRequest: { is: { status: { title: 'approved' } } },
    } });
    const activeMentors = await tx.user.count({ where: {
      roles: { some: { deletedAt: null, startAt: { lte: now }, role: { name: 'mentor' } } },
    } });
    const reservedOffers = await tx.mentorSlotOffer.count({ where: { status: 'OFFERED', expiresAt: { gt: now } } });
    return mentorCapacity(approvedGraduates, policy.percentage, activeMentors, reservedOffers);
  }

  private async notify(tx: Tx, requestId: string, recipient: string, type: EventType, suffix = type) {
    await tx.mentorEmailOutbox.create({ data: {
      requestId, recipient, type, eventKey: `${requestId}:${suffix}`,
      payload: { appUrl: `${process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:3000'}/mentors/participation` },
    } });
  }

  private async expireAndFill(tx: Tx, now: Date): Promise<void> {
    const expired = await tx.mentorSlotOffer.findMany({
      where: { status: 'OFFERED', expiresAt: { lte: now } },
      include: { request: { include: { user: { select: { email: true } } } } },
    });
    for (const offer of expired) {
      await tx.mentorSlotOffer.update({ where: { id: offer.id }, data: { status: 'EXPIRED', expiredAt: now } });
      await tx.mentorParticipationRequest.update({ where: { id: offer.requestId }, data: { status: 'EXPIRED' } });
      await this.notify(tx, offer.requestId, offer.request.user.email, 'EXPIRED');
    }
    let available = (await this.capacityIn(tx, now)).available;
    while (available > 0) {
      const next = await tx.mentorParticipationRequest.findFirst({
        where: { status: 'PENDING' }, orderBy: [{ queuedAt: 'asc' }, { id: 'asc' }],
        include: { user: { select: { id: true, email: true, isActive: true,
          roles: { where: { deletedAt: null, startAt: { lte: now } }, select: { role: { select: { name: true } } } },
          approvedAccessRequest: { select: { status: { select: { title: true } } } },
        } } },
      });
      if (!next) break;
      const eligible = next.user.isActive && next.user.roles.some(({ role }) => role.name === 'titulado') &&
        next.user.approvedAccessRequest?.status.title === 'approved' &&
        !next.user.roles.some(({ role }) => role.name === 'mentor');
      if (!eligible) {
        // Keep historical order; an ineligible request cannot block the queue forever.
        await tx.mentorParticipationRequest.update({ where: { id: next.id }, data: { status: 'CANCELLED', cancelledAt: now } });
        await this.notify(tx, next.id, next.user.email, 'CANCELLED');
        continue;
      }
      await tx.mentorSlotOffer.create({ data: {
        requestId: next.id, status: 'OFFERED', offeredAt: now,
        expiresAt: new Date(now.getTime() + DAY_MS),
      } });
      await tx.mentorParticipationRequest.update({ where: { id: next.id }, data: { status: 'OFFERED' } });
      await this.notify(tx, next.id, next.user.email, 'OFFERED');
      available -= 1;
    }
  }

  private async assertEligible(tx: Tx, userId: string, now: Date) {
    const user = await tx.user.findUnique({ where: { id: userId }, include: {
      approvedAccessRequest: { include: { status: true } },
      roles: { where: { deletedAt: null, startAt: { lte: now } }, include: { role: true } },
    } });
    if (!user?.isActive || !user.roles.some(({ role }) => role.name === 'titulado') ||
      user.approvedAccessRequest?.status.title !== 'approved') {
      throw new ParticipationException('Se requiere una cuenta de titulado aprobada y vinculada', 403);
    }
    if (user.roles.some(({ role }) => role.name === 'mentor')) {
      throw new ParticipationException('Tu participación como mentor ya está activa');
    }
    return user;
  }

  private async assertPreferences(tx: Tx, data: ParticipationPreferencesDto) {
    const [areas, orientations] = await Promise.all([
      tx.technicalArea.count({ where: { id: { in: data.technicalAreaIds } } }),
      tx.orientationType.count({ where: { id: { in: data.orientationTypeIds }, isActive: true } }),
    ]);
    if (areas !== data.technicalAreaIds.length || orientations !== data.orientationTypeIds.length) {
      throw new ParticipationException('Selecciona áreas y orientaciones válidas', 422);
    }
  }

  private async current(tx: Tx, userId: string) {
    return tx.mentorParticipationRequest.findFirst({
      where: { userId, status: { in: ['PENDING', 'OFFERED', 'ACTIVE'] } },
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
      include: {
        technicalAreas: { include: { technicalArea: { select: { id: true, name: true } } } },
        orientationTypes: { include: { orientationType: { select: { id: true, name: true } } } },
        offers: { orderBy: { offeredAt: 'desc' }, take: 1 },
      },
    });
  }

  async capacity() {
    return this.transaction(async (tx, now) => { await this.expireAndFill(tx, now); return this.capacityIn(tx, now); });
  }

  async me(userId: string) {
    return this.transaction(async (tx, now) => {
      await this.expireAndFill(tx, now);
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true,
        roles: { where: { deletedAt: null, startAt: { lte: now }, role: { name: 'mentor' } }, select: { id: true } },
      } });
      const request = await this.current(tx, userId);
      const latest = request ?? await tx.mentorParticipationRequest.findFirst({ where: { userId }, orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }], include: {
        technicalAreas: { include: { technicalArea: { select: { id: true, name: true } } } },
        orientationTypes: { include: { orientationType: { select: { id: true, name: true } } } },
        offers: { orderBy: { offeredAt: 'desc' }, take: 1 },
      } });
      const [sanction] = await tx.$queryRaw<{ startsAt: Date; expiresAt: Date }[]>`
        SELECT starts_at AS "startsAt", expires_at AS "expiresAt"
        FROM mentor_participation_sanctions
        WHERE user_id = ${userId}::uuid AND lifted_at IS NULL AND expires_at > clock_timestamp()
        ORDER BY expires_at DESC LIMIT 1`;
      return { email: user?.email ?? null, status: user?.roles.length ? 'ACTIVE' : (latest?.status ?? 'NONE'), sanction: sanction ?? null,
        request: latest ? { id: latest.id, requestedAt: latest.requestedAt, queuedAt: latest.queuedAt,
          technicalAreas: latest.technicalAreas.map(({ technicalArea }) => technicalArea),
          orientationTypes: latest.orientationTypes.map(({ orientationType }) => orientationType),
          offer: latest.offers[0] ?? null,
        } : null,
      };
    });
  }

  async request(userId: string, data: ParticipationPreferencesDto, key: string = randomUUID()) {
    return this.intake(userId, data, key, 'REQUEST', async (tx, now, email) => {
      const current = await this.current(tx, userId);
      if (current) return { statusCode: 409, outcome: 'DUPLICATE',
        detail: 'Ya tienes una solicitud vigente', data: { code: 'DUPLICATE_REQUEST',
          id: current.id, status: current.status, requestedAt: current.requestedAt.toISOString() } };
      if ((await this.capacityIn(tx, now)).available > 0) {
        return { statusCode: 409, outcome: 'SLOT_AVAILABLE',
          detail: 'Hay un cupo disponible; confirma tu participación desde el formulario', data: { code: 'SLOT_AVAILABLE' } };
      }
      const request = await tx.mentorParticipationRequest.create({ data: {
        userId, status: 'PENDING', requestedAt: now, queuedAt: now,
        technicalAreas: { create: data.technicalAreaIds.map((technicalAreaId) => ({ technicalAreaId })) },
        orientationTypes: { create: data.orientationTypeIds.map((orientationTypeId) => ({ orientationTypeId })) },
      } });
      await this.notify(tx, request.id, email, 'WAITING');
      return { statusCode: 201, outcome: 'PENDING', data: { id: request.id, status: request.status,
        requestedAt: request.requestedAt.toISOString() } };
    });
  }

  async activate(userId: string, data: ParticipationPreferencesDto, key: string = randomUUID()) {
    return this.intake(userId, data, key, 'ACTIVATE', async (tx, now, email) => {
      const current = await this.current(tx, userId);
      if (current) return { statusCode: 409, outcome: 'DUPLICATE',
        detail: 'Ya tienes una solicitud vigente', data: { code: 'DUPLICATE_REQUEST',
          id: current.id, status: current.status, requestedAt: current.requestedAt.toISOString() } };
      if ((await this.capacityIn(tx, now)).available < 1) {
        return { statusCode: 409, outcome: 'NO_SLOTS', detail: 'No hay cupos disponibles', data: { code: 'NO_SLOTS' } };
      }
      const role = await tx.role.findUnique({ where: { name: 'mentor' } });
      if (!role) throw new ParticipationException('Falta el rol mentor', 500);
      const request = await tx.mentorParticipationRequest.create({ data: {
        userId, status: 'ACTIVE', requestedAt: now, activatedAt: now,
        technicalAreas: { create: data.technicalAreaIds.map((technicalAreaId) => ({ technicalAreaId })) },
        orientationTypes: { create: data.orientationTypeIds.map((orientationTypeId) => ({ orientationTypeId })) },
      } });
      await tx.userRole.create({ data: { userId, roleId: role.id } });
      await tx.mentorTechnicalArea.deleteMany({ where: { mentorId: userId } });
      await tx.mentorOrientationType.deleteMany({ where: { mentorId: userId } });
      await tx.mentorTechnicalArea.createMany({ data: data.technicalAreaIds.map((technicalAreaId) => ({ mentorId: userId, technicalAreaId })), skipDuplicates: true });
      await tx.mentorOrientationType.createMany({ data: data.orientationTypeIds.map((orientationTypeId) => ({ mentorId: userId, orientationTypeId })), skipDuplicates: true });
      await tx.user.update({ where: { id: userId }, data: { isAvailableForMentoring: true } });
      await this.notify(tx, request.id, email, 'ACTIVE');
      return { statusCode: 201, outcome: 'ACTIVE', data: { id: userId, requestId: request.id, status: 'ACTIVE' } };
    });
  }

  async preferences(userId: string, data: ParticipationPreferencesDto) {
    return this.transaction(async (tx, now) => {
      await this.expireAndFill(tx, now);
      await this.assertPreferences(tx, data);
      const request = await this.current(tx, userId);
      if (!request || request.status !== 'PENDING') throw new ParticipationException('Solo puedes editar una solicitud pendiente');
      await tx.mentorRequestTechnicalArea.deleteMany({ where: { requestId: request.id } });
      await tx.mentorRequestOrientationType.deleteMany({ where: { requestId: request.id } });
      await tx.mentorRequestTechnicalArea.createMany({ data: data.technicalAreaIds.map((technicalAreaId) => ({ requestId: request.id, technicalAreaId })) });
      await tx.mentorRequestOrientationType.createMany({ data: data.orientationTypeIds.map((orientationTypeId) => ({ requestId: request.id, orientationTypeId })) });
      return { id: request.id, status: request.status, requestedAt: request.requestedAt };
    });
  }

  async cancel(userId: string) {
    return this.transaction(async (tx, now) => {
      await this.expireAndFill(tx, now);
      const request = await this.current(tx, userId);
      if (!request || !['PENDING', 'OFFERED'].includes(request.status)) throw new ParticipationException('No hay solicitud cancelable');
      if (request.status === 'OFFERED') await tx.mentorSlotOffer.updateMany({ where: { requestId: request.id, status: 'OFFERED' }, data: { status: 'CANCELLED', cancelledAt: now } });
      await tx.mentorParticipationRequest.update({ where: { id: request.id }, data: { status: 'CANCELLED', cancelledAt: now } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
      await this.notify(tx, request.id, user.email, 'CANCELLED');
      await this.expireAndFill(tx, now);
      return { id: request.id, status: 'CANCELLED' };
    });
  }

  async confirm(userId: string, offerId: string) {
    const result = await this.transaction(async (tx, now) => {
      await this.expireAndFill(tx, now);
      const offer = await tx.mentorSlotOffer.findUnique({ where: { id: offerId }, include: { request: { include: {
        technicalAreas: true, orientationTypes: true, user: true,
      } } } });
      if (!offer || offer.request.userId !== userId) throw new ParticipationException('Oferta no encontrada', 404);
      if (offer.status === 'CONFIRMED' && offer.request.status === 'ACTIVE') return { id: userId, status: 'ACTIVE', alreadyConfirmed: true };
      if (offer.status !== 'OFFERED' || now >= offer.expiresAt || offer.request.status !== 'OFFERED') {
        return { expired: true };
      }
      await this.assertEligible(tx, userId, now);
      const role = await tx.role.findUnique({ where: { name: 'mentor' } });
      if (!role) throw new ParticipationException('Falta el rol mentor', 500);
      await tx.userRole.create({ data: { userId, roleId: role.id } });
      await tx.mentorTechnicalArea.deleteMany({ where: { mentorId: userId } });
      await tx.mentorOrientationType.deleteMany({ where: { mentorId: userId } });
      await tx.mentorTechnicalArea.createMany({ data: offer.request.technicalAreas.map(({ technicalAreaId }) => ({ mentorId: userId, technicalAreaId })), skipDuplicates: true });
      await tx.mentorOrientationType.createMany({ data: offer.request.orientationTypes.map(({ orientationTypeId }) => ({ mentorId: userId, orientationTypeId })), skipDuplicates: true });
      await tx.user.update({ where: { id: userId }, data: { isAvailableForMentoring: true } });
      await tx.mentorSlotOffer.update({ where: { id: offerId }, data: { status: 'CONFIRMED', confirmedAt: now } });
      await tx.mentorParticipationRequest.update({ where: { id: offer.requestId }, data: { status: 'ACTIVE', activatedAt: now } });
      await this.notify(tx, offer.requestId, offer.request.user.email, 'ACTIVE');
      return { id: userId, status: 'ACTIVE', alreadyConfirmed: false };
    });
    if ('expired' in result) throw new ParticipationException('El plazo venció. Crea una solicitud nueva');
    return result;
  }

  async leave(userId: string) {
    return this.transaction(async (tx, now) => {
      await this.expireAndFill(tx, now);
      const future = await tx.appointment.count({ where: { mentorId: userId, startAt: { gt: now }, status: { title: { in: [...ACTIVE_APPOINTMENT_STATUSES] } } } });
      if (future) throw new ParticipationException('Tienes citas futuras pendientes o confirmadas; resuélvelas antes de pausar la mentoría',
        409, { code: 'FUTURE_APPOINTMENTS', appointmentsUrl: '/mentor/availability' });
      const roles = await tx.userRole.updateMany({ where: { userId, deletedAt: null, startAt: { lte: now }, role: { name: 'mentor' } }, data: { deletedAt: now } });
      if (!roles.count) {
        const latest = await tx.mentorParticipationRequest.findFirst({ where: { userId }, orderBy: { requestedAt: 'desc' } });
        if (latest?.status === 'LEFT') return { status: 'LEFT', alreadyLeft: true };
        throw new ParticipationException('No participas como mentor');
      }
      await tx.mentorParticipationRequest.updateMany({ where: { userId, status: 'ACTIVE' }, data: { status: 'LEFT', leftAt: now } });
      await tx.user.update({ where: { id: userId }, data: { isAvailableForMentoring: false } });
      await this.expireAndFill(tx, now);
      return { status: 'LEFT' };
    });
  }

  async reconcile() {
    return this.transaction(async (tx, now) => { await this.expireAndFill(tx, now); return this.capacityIn(tx, now); });
  }
}
