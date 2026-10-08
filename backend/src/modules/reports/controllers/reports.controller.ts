import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { toRegisteredUsersReportType } from '../mappers/generated-report.mapper.js';
import {
  registeredUsersFiltersSchema,
  registeredUsersQuerySchema,
  rejectedUsersFiltersSchema,
  rejectedUsersQuerySchema,
  type RegisteredUsersFilters,
  type RegisteredUsersQuery,
  type RejectedUsersFilters,
  type RejectedUsersQuery,
} from '../requests/report-users.schema.js';
import {
  reportHistoryQuerySchema,
  type ReportHistoryQuery,
} from '../requests/report-history.schema.js';
import { ReportHistoryService } from '../services/report-history.service.js';
import { ReportsService } from '../services/reports.service.js';
import type { ReportCsvFile } from '../types/report-user.types.js';

function toCsvFile({ fileName, content }: ReportCsvFile): StreamableFile {
  return new StreamableFile(Buffer.from(content, 'utf-8'), {
    type: 'text/csv; charset=utf-8',
    disposition: `attachment; filename="${fileName}"`,
  });
}

@ApiTags('Reportes')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportHistoryService: ReportHistoryService,
  ) {}

  @Get('registered-users')
  @ResponseMessage('Usuarios registrados obtenidos correctamente')
  getRegisteredUsers(
    @Query(new ZodValidationPipe(registeredUsersQuerySchema))
    query: RegisteredUsersQuery,
  ) {
    return this.reportsService.getRegisteredUsers(query);
  }

  @Get('registered-users/export')
  @ApiProduces('text/csv')
  exportRegisteredUsersCsv(
    @Query(new ZodValidationPipe(registeredUsersFiltersSchema))
    filters: RegisteredUsersFilters,
  ): StreamableFile {
    const file = this.reportsService.exportRegisteredUsersCsv(filters);
    this.reportHistoryService.registerGeneratedReport({
      fileName: file.fileName,
      reportType: toRegisteredUsersReportType(filters.userType),
    });
    return toCsvFile(file);
  }

  @Get('rejected-users')
  @ResponseMessage('Usuarios rechazados obtenidos correctamente')
  getRejectedUsers(
    @Query(new ZodValidationPipe(rejectedUsersQuerySchema))
    query: RejectedUsersQuery,
  ) {
    return this.reportsService.getRejectedUsers(query);
  }

  @Get('rejected-users/export')
  @ApiProduces('text/csv')
  exportRejectedUsersCsv(
    @Query(new ZodValidationPipe(rejectedUsersFiltersSchema))
    filters: RejectedUsersFilters,
  ): StreamableFile {
    const file = this.reportsService.exportRejectedUsersCsv(filters);
    this.reportHistoryService.registerGeneratedReport({
      fileName: file.fileName,
      reportType: 'REJECTED_USERS',
    });
    return toCsvFile(file);
  }

  @Get('history')
  @ResponseMessage('Historial de reportes obtenido correctamente')
  getReportHistory(
    @Query(new ZodValidationPipe(reportHistoryQuerySchema))
    query: ReportHistoryQuery,
  ) {
    return this.reportHistoryService.getReportHistory(query);
  }
}
