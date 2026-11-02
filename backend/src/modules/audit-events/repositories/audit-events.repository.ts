import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import {
  AUDIT_EVENT_LIST_SELECT,
  AUDIT_EVENT_ORDER,
  AUDIT_TIMELINE_ORDER,
  AUDIT_TIMELINE_SELECT,
} from '../constants/audit-event-selects.constants.js';
import { buildAuditEventsWhere } from '../helpers/build-audit-events-where.js';
import { AUDIT_ACTOR_ROLE } from '../types/audit-actor-role.enum.js';
import type { AuditEventFilters } from '../types/audit-event-filters.types.js';
import type { RecordAuditEventInput } from '../types/record-audit-event-input.types.js';

type AuditClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuditEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: RecordAuditEventInput, client: AuditClient = this.prisma) {
    const { accessRequestId, action, actor, evidenceFileId, ...snapshot } = input;
    return client.auditEvent.create({
      data: {
        ...snapshot,
        actorName: actor.name,
        actorRole: actor.role,
        accessRequest: { connect: { id: accessRequestId } },
        action: { connectOrCreate: { where: { title: action }, create: { title: action } } },
        ...(actor.id && { actor: { connect: { id: actor.id } } }),
        ...(evidenceFileId && { evidenceFile: { connect: { id: evidenceFileId } } }),
      },
      select: { id: true },
    });
  }

  async findPage(params: { filters: AuditEventFilters; skip: number; take: number }) {
    const where = buildAuditEventsWhere(params.filters);
    const [rows, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: AUDIT_EVENT_ORDER,
        skip: params.skip,
        take: params.take,
        select: AUDIT_EVENT_LIST_SELECT,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return { rows, total };
  }

  findBatch(params: { filters: AuditEventFilters; skip: number; take: number }) {
    return this.prisma.auditEvent.findMany({
      where: buildAuditEventsWhere(params.filters),
      orderBy: AUDIT_EVENT_ORDER,
      skip: params.skip,
      take: params.take,
      select: AUDIT_EVENT_LIST_SELECT,
    });
  }

  async findResponsibles() {
    const [people, systemEvent] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: { actorId: { not: null } },
        distinct: ['actorId'],
        orderBy: [{ actorId: 'asc' }, { occurredAt: 'desc' }],
        select: { actorId: true, actorName: true },
      }),
      this.prisma.auditEvent.findFirst({ where: { actorRole: AUDIT_ACTOR_ROLE.SYSTEM }, select: { id: true } }),
    ]);
    return { people, hasSystemEvents: systemEvent !== null };
  }

  findEvidenceReference(id: string) {
    return this.prisma.auditEvent.findUnique({ where: { id }, select: { id: true, evidenceFileId: true } });
  }

  findTimeline(accessRequestId: string) {
    return this.prisma.auditEvent.findMany({
      where: { accessRequestId },
      orderBy: AUDIT_TIMELINE_ORDER,
      select: AUDIT_TIMELINE_SELECT,
    });
  }
}
