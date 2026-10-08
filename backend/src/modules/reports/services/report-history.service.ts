import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../common/types/api-response.types.js';
import { paginate } from '../../../common/utils/pagination.js';
import { GeneratedReportsRepository } from '../repositories/generated-reports.repository.js';
import type { ReportHistoryQuery } from '../requests/report-history.schema.js';
import type {
  GeneratedReport,
  RegisterGeneratedReportInput,
} from '../types/generated-report.types.js';

function sortByNewest(reports: readonly GeneratedReport[]): GeneratedReport[] {
  return [...reports].sort(
    (first, second) =>
      new Date(second.generatedAt).getTime() -
      new Date(first.generatedAt).getTime(),
  );
}

@Injectable()
export class ReportHistoryService {
  constructor(
    private readonly generatedReportsRepository: GeneratedReportsRepository,
  ) {}

  // Historial de reportes generados, del más reciente al más antiguo.
  async getReportHistory(
    query: ReportHistoryQuery,
  ): Promise<PaginatedResult<GeneratedReport>> {
    const reports = sortByNewest(
      await this.generatedReportsRepository.findAll(),
    );

    return paginate(reports, query.page, query.limit);
  }

  // Registra un reporte al completarse su exportación. Cada registro recibe su
  // propio id, así varios reportes generados a la vez no se pisan entre sí.
  registerGeneratedReport(
    input: RegisterGeneratedReportInput,
  ): GeneratedReport {
    return this.generatedReportsRepository.create({
      id: randomUUID(),
      fileName: input.fileName,
      reportType: input.reportType,
      generatedAt: new Date().toISOString(),
    });
  }
}
