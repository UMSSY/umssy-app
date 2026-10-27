import { MentorIntakeOperationCode } from '../types/mentor-intake-operation.enum.js';
import { isEligibleMentor } from './mentor-eligibility.service.js';
import { MentorRequestStatusCode } from '../types/mentor-request-status.enum.js';
import { Injectable } from '@nestjs/common';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';
import type { CreateMentorParticipationDto } from '../requests/create-mentor-participation.schema.js';
import type { MentorTransaction } from '../types/mentor-transaction.types.js';
import type { MentorParticipationRequest } from '../types/mentor-participation-request.types.js';
import { withMentorIntake } from './mentor-intake.service.js';
import { reconcileMentorOffers } from './mentor-offer-allocation.service.js';
import { mentorCapacity } from '../utils/mentor-capacity.js';

@Injectable()
export class MentorParticipationService {
  constructor(private readonly repository: MentorParticipationRepository) {}

  async create(
    userId: string,
    data: CreateMentorParticipationDto,
    key?: string,
    tx?: MentorTransaction,
  ): Promise<MentorParticipationRequest> {
    if (key)
      return withMentorIntake(
        this.repository,
        userId,
        MentorIntakeOperationCode.REQUEST,
        key,
        data,
        (transaction) => this.create(userId, data, undefined, transaction),
      );
    if (!tx)
      return this.repository.withLock((transaction) =>
        this.create(userId, data, undefined, transaction),
      );
    const eligibility = await this.repository.admissionFacts(userId, tx);
    if (!isEligibleMentor(eligibility) || eligibility.alreadyMentor)
      throw new MentorParticipationException(
        'No cumples los requisitos para solicitar un cupo',
        403,
      );
    await reconcileMentorOffers(this.repository, tx);
    const existing = await this.repository.openRequest(tx, userId);
    if (existing || (await this.repository.hasOffer(tx, userId)))
      throw new MentorParticipationException(
        'Ya tienes una solicitud pendiente o una oferta vigente',
        409,
        { code: 'REQUEST_ALREADY_EXISTS' },
      );
    await this.validatePreferences(tx, data);
    const capacity = mentorCapacity(await this.repository.capacityCounts(tx));
    if (capacity.available > 0)
      throw new MentorParticipationException(
        'Hay cupos disponibles para activación directa',
        409,
        { code: 'CAPACITY_AVAILABLE' },
      );
    return this.repository.createRequest(
      tx,
      userId,
      data.technicalAreaIds,
      data.orientationTypeIds,
    );
  }

  findMyRequest(userId: string) {
    return this.repository.withLock(async (tx) => {
      await reconcileMentorOffers(this.repository, tx);
      const request = await this.repository.findMyRequest(userId, tx);
      if (!request) return null;
      if (
        ![
          MentorRequestStatusCode.PENDING,
          MentorRequestStatusCode.OFFERED,
          MentorRequestStatusCode.ACTIVE,
        ].some((status) => status === request.status.title)
      ) {
        const { alreadyMentor } = await this.repository.admissionFacts(
          userId,
          tx,
        );
        if (alreadyMentor) return null;
      }
      const { user, ...details } = request;
      return {
        ...details,
        status: request.status.title,
        offer: request.offer
          ? { ...request.offer, status: request.offer.status.title }
          : null,
        email: user.email,
      };
    });
  }

  findMyHistory(userId: string) {
    return this.repository.findMyHistory(userId);
  }

  updatePreferences(userId: string, data: CreateMentorParticipationDto) {
    return this.repository.withLock(async (tx) => {
      const pending = await this.repository.pendingRequest(tx, userId);
      if (!pending)
        throw new MentorParticipationException(
          'No tienes una solicitud pendiente para modificar',
          404,
        );
      await this.validatePreferences(tx, data);
      return this.repository.updatePreferences(
        tx,
        pending.id,
        data.technicalAreaIds,
        data.orientationTypeIds,
      );
    });
  }

  cancel(userId: string) {
    return this.repository.withLock(async (tx) => {
      const request = await this.repository.cancelRequest(tx, userId);
      if (!request)
        throw new MentorParticipationException(
          'No tienes una solicitud pendiente para cancelar',
          404,
        );
      return request;
    });
  }

  private async validatePreferences(
    tx: MentorTransaction,
    data: CreateMentorParticipationDto,
  ) {
    const { technicalAreaIds: areas, orientationTypeIds: orientations } = data;
    const counts = await this.repository.preferenceCounts(
      tx,
      areas,
      orientations,
    );
    if (
      !areas.length ||
      !orientations.length ||
      new Set(areas).size !== areas.length ||
      new Set(orientations).size !== orientations.length ||
      counts.areas !== areas.length ||
      counts.orientations !== orientations.length
    )
      throw new MentorParticipationException(
        'Las preferencias seleccionadas no son válidas',
        400,
      );
  }
}
