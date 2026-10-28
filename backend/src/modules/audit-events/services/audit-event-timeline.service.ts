import { Injectable } from '@nestjs/common';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';
import type { AuditActionName } from '../types/audit-action.enum.js';
import type { AuditActorRole } from '../types/audit-actor-role.enum.js';
import type { AuditTimelineItemResponse } from '../types/audit-timeline-item.types.js';

@Injectable()
export class AuditEventTimelineService {
  constructor(private readonly auditEventsRepository: AuditEventsRepository) {}

  async listForRequest(accessRequestId: string): Promise<AuditTimelineItemResponse[]> {
    const rows = await this.auditEventsRepository.findTimeline(accessRequestId);
    return rows.map((row) => ({
      id: row.id,
      action: row.action.title as AuditActionName,
      occurredAt: row.occurredAt.toISOString(),
      actorName: row.actorName,
      actorRole: row.actorRole as AuditActorRole,
      detail: row.detail,
    }));
  }
}
