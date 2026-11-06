import { Injectable } from '@nestjs/common';
import { buildCsv } from '../../../common/utils/csv.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { AUDIT_CSV_FILE_PREFIX, AUDIT_CSV_HEADERS, AUDIT_EXPORT_BATCH_SIZE } from '../constants/audit-events-export.constants.js';
import { toAuditEventListItem } from '../mappers/audit-event.mapper.js';
import { toAuditEventCsvRow } from '../mappers/audit-event-csv.mapper.js';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';
import type { AuditCsvFile } from '../types/audit-csv-file.types.js';
import type { AuditEventFilters } from '../types/audit-event-filters.types.js';

@Injectable()
export class AuditEventsExportService {
  constructor(private readonly auditEventsRepository: AuditEventsRepository) {}

  // Exporta todo el conjunto filtrado por lotes, con el mismo filtro y orden del listado
  async exportCsv(filters: AuditEventFilters, now: Date = new Date()): Promise<AuditCsvFile> {
    const rows: string[][] = [];
    for (let skip = 0; ; skip += AUDIT_EXPORT_BATCH_SIZE) {
      const batch = await this.auditEventsRepository.findBatch({ filters, skip, take: AUDIT_EXPORT_BATCH_SIZE });
      rows.push(...batch.map((row) => toAuditEventCsvRow(toAuditEventListItem(row))));
      if (batch.length < AUDIT_EXPORT_BATCH_SIZE) break;
    }
    return {
      fileName: `${AUDIT_CSV_FILE_PREFIX}-${toBoliviaTime(now).date}.csv`,
      content: buildCsv(AUDIT_CSV_HEADERS, rows),
    };
  }
}
