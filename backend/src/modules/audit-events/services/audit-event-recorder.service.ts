import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { MAX_AUDIT_DETAIL_LENGTH } from '../constants/audit-events.constants.js';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';
import type { RecordAuditEventInput } from '../types/record-audit-event-input.types.js';

// API pública para que otros módulos registren hechos; la fecha la pone la base, no el cliente
@Injectable()
export class AuditEventRecorderService {
  constructor(private readonly auditEventsRepository: AuditEventsRepository) {}

  // Con tx el evento se guarda en la misma transacción que el cambio que lo origina
  record(input: RecordAuditEventInput, tx?: Prisma.TransactionClient) {
    const detail = input.detail ? input.detail.slice(0, MAX_AUDIT_DETAIL_LENGTH) : null;
    return this.auditEventsRepository.create({ ...input, detail }, tx);
  }
}
