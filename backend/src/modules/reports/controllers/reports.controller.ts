import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import {
  FORBIDDEN_ROLE_RESPONSE,
  INTERNAL_ERROR_RESPONSE,
  UNAUTHENTICATED_RESPONSE,
} from '../../../common/constants/api-error-swagger.constants.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import {
  REGISTERED_USERS_EXPORT_DESCRIPTION,
  REGISTERED_USERS_EXPORT_OK_RESPONSE,
  REJECTED_USERS_EXPORT_DESCRIPTION,
  REJECTED_USERS_EXPORT_OK_RESPONSE,
  REPORT_EXPORT_AUTHOR_NOT_FOUND_RESPONSE,
  REPORT_EXPORT_BAD_REQUEST_RESPONSE,
  REPORT_EXPORT_QUERY,
} from '../constants/report-export-swagger.constants.js';
import {
  REGISTERED_USERS_LIST_DESCRIPTION,
  REGISTERED_USERS_LIST_OK_RESPONSE,
  REJECTED_USERS_LIST_DESCRIPTION,
  REJECTED_USERS_LIST_OK_RESPONSE,
  REPORT_HISTORY_BAD_REQUEST_RESPONSE,
  REPORT_HISTORY_DESCRIPTION,
  REPORT_HISTORY_OK_RESPONSE,
  REPORT_HISTORY_QUERY,
  REPORT_USERS_LIST_BAD_REQUEST_RESPONSE,
  REPORT_USERS_LIST_QUERY,
} from '../constants/report-listing-swagger.constants.js';
import { toRegisteredUsersReportType } from '../mappers/generated-report.mapper.js';
import {
  registeredUsersExportQuerySchema,
  registeredUsersQuerySchema,
  rejectedUsersExportQuerySchema,
  rejectedUsersQuerySchema,
  type RegisteredUsersQuery,
  type RejectedUsersQuery,
} from '../requests/report-users.schema.js';
import {
  reportHistoryQuerySchema,
  type ReportHistoryQuery,
} from '../requests/report-history.schema.js';

import { ReportHistoryService } from '../services/report-history.service.js';
import { ReportsService } from '../services/reports.service.js';
import type { RegisteredUsersExportQuery } from '../types/registered-users-export-query.types.js';
import type { RejectedUsersExportQuery } from '../types/rejected-users-export-query.types.js';
import type { ReportPdfFile } from '../types/report-pdf-file.types.js';
import type { ReportCsvFile } from '../types/report-user.types.js';

function toCsvFile({ fileName, content }: ReportCsvFile): StreamableFile {
  return new StreamableFile(Buffer.from(content, 'utf-8'), {
    type: 'text/csv; charset=utf-8',
    disposition: `attachment; filename="${fileName}"`,
  });
}

function toPdfFile({ fileName, content }: ReportPdfFile): StreamableFile {
  return new StreamableFile(content, {
    type: 'application/pdf',
    disposition: `attachment; filename="${fileName}"`,
  });
}

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrativo')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportHistoryService: ReportHistoryService,
  ) {}

  @Get('registered-users')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({
    operationId: 'listRegisteredUsers',
    summary: 'Lista los usuarios registrados (aprobados)',
    description: REGISTERED_USERS_LIST_DESCRIPTION,
  })
  @ApiQuery(REPORT_USERS_LIST_QUERY.registeredLimit)
  @ApiQuery(REPORT_USERS_LIST_QUERY.page)
  @ApiQuery(REPORT_USERS_LIST_QUERY.snapshotAt)
  @ApiQuery(REPORT_USERS_LIST_QUERY.search)
  @ApiQuery(REPORT_USERS_LIST_QUERY.period)
  @ApiQuery(REPORT_USERS_LIST_QUERY.userType)
  @ApiResponse(REGISTERED_USERS_LIST_OK_RESPONSE)
  @ApiResponse(REPORT_USERS_LIST_BAD_REQUEST_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  getRegisteredUsers(
    @Query(new ZodValidationPipe(registeredUsersQuerySchema))
    query: RegisteredUsersQuery,
  ) {
    return this.reportsService.getRegisteredUsers(query);
  }

  @Get('registered-users/export')
  @ApiProduces('text/csv', 'application/pdf')
  @ApiOperation({
    operationId: 'exportRegisteredUsersReport',
    summary: 'Exporta el reporte de usuarios registrados en CSV o PDF',
    description: REGISTERED_USERS_EXPORT_DESCRIPTION,
  })
  @ApiQuery(REPORT_EXPORT_QUERY.format)
  @ApiQuery(REPORT_EXPORT_QUERY.limit)
  @ApiQuery(REPORT_EXPORT_QUERY.page)
  @ApiQuery(REPORT_EXPORT_QUERY.snapshotAt)
  @ApiQuery(REPORT_EXPORT_QUERY.search)
  @ApiQuery(REPORT_EXPORT_QUERY.period)
  @ApiQuery(REPORT_EXPORT_QUERY.userType)
  @ApiResponse(REGISTERED_USERS_EXPORT_OK_RESPONSE)
  @ApiResponse(REPORT_EXPORT_BAD_REQUEST_RESPONSE)
  @ApiResponse(REPORT_EXPORT_AUTHOR_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  async exportRegisteredUsersCsv(
    @Query(new ZodValidationPipe(registeredUsersExportQuerySchema))
    filters: RegisteredUsersExportQuery,
    @CurrentUserId() userId: string,
  ): Promise<StreamableFile> {
    const reportType = toRegisteredUsersReportType(filters.userType);
    if (filters.format === 'pdf') {
      const file = await this.reportsService.exportRegisteredUsersPdf(filters, userId);
      await this.reportHistoryService.registerGeneratedReport(userId, { fileName: file.fileName, reportType });
      return toPdfFile(file);
    }
    const file = await this.reportsService.exportRegisteredUsersCsv(filters);
    await this.reportHistoryService.registerGeneratedReport(userId, { fileName: file.fileName, reportType });
    return toCsvFile(file);
  }

  @Get('rejected-users')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({
    operationId: 'listRejectedUsers',
    summary: 'Lista las solicitudes de acceso rechazadas',
    description: REJECTED_USERS_LIST_DESCRIPTION,
  })
  @ApiQuery(REPORT_USERS_LIST_QUERY.rejectedLimit)
  @ApiQuery(REPORT_USERS_LIST_QUERY.page)
  @ApiQuery(REPORT_USERS_LIST_QUERY.snapshotAt)
  @ApiQuery(REPORT_USERS_LIST_QUERY.search)
  @ApiQuery(REPORT_USERS_LIST_QUERY.period)
  @ApiQuery(REPORT_USERS_LIST_QUERY.userType)
  @ApiResponse(REJECTED_USERS_LIST_OK_RESPONSE)
  @ApiResponse(REPORT_USERS_LIST_BAD_REQUEST_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  getRejectedUsers(
    @Query(new ZodValidationPipe(rejectedUsersQuerySchema))
    query: RejectedUsersQuery,
  ) {
    return this.reportsService.getRejectedUsers(query);
  }

  @Get('rejected-users/export')
  @ApiProduces('text/csv', 'application/pdf')
  @ApiOperation({
    operationId: 'exportRejectedUsersReport',
    summary: 'Exporta el reporte de usuarios rechazados en CSV o PDF',
    description: REJECTED_USERS_EXPORT_DESCRIPTION,
  })
  @ApiQuery(REPORT_EXPORT_QUERY.format)
  @ApiQuery(REPORT_EXPORT_QUERY.limit)
  @ApiQuery(REPORT_EXPORT_QUERY.page)
  @ApiQuery(REPORT_EXPORT_QUERY.snapshotAt)
  @ApiQuery(REPORT_EXPORT_QUERY.search)
  @ApiQuery(REPORT_EXPORT_QUERY.period)
  @ApiQuery(REPORT_EXPORT_QUERY.userType)
  @ApiResponse(REJECTED_USERS_EXPORT_OK_RESPONSE)
  @ApiResponse(REPORT_EXPORT_BAD_REQUEST_RESPONSE)
  @ApiResponse(REPORT_EXPORT_AUTHOR_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  async exportRejectedUsersCsv(
    @Query(new ZodValidationPipe(rejectedUsersExportQuerySchema))
    filters: RejectedUsersExportQuery,
    @CurrentUserId() userId: string,
  ): Promise<StreamableFile> {
    const reportType = 'REJECTED_USERS';
    if (filters.format === 'pdf') {
      const file = await this.reportsService.exportRejectedUsersPdf(filters, userId);
      await this.reportHistoryService.registerGeneratedReport(userId, { fileName: file.fileName, reportType });
      return toPdfFile(file);
    }
    const file = await this.reportsService.exportRejectedUsersCsv(filters);
    await this.reportHistoryService.registerGeneratedReport(userId, { fileName: file.fileName, reportType });
    return toCsvFile(file);
  }

  @Get('history')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({
    operationId: 'listReportHistory',
    summary: 'Lista el historial de reportes generados por el administrador',
    description: REPORT_HISTORY_DESCRIPTION,
  })
  @ApiQuery(REPORT_HISTORY_QUERY.limit)
  @ApiQuery(REPORT_HISTORY_QUERY.page)
  @ApiQuery(REPORT_HISTORY_QUERY.snapshotAt)
  @ApiQuery(REPORT_HISTORY_QUERY.search)
  @ApiQuery(REPORT_HISTORY_QUERY.reportType)
  @ApiResponse(REPORT_HISTORY_OK_RESPONSE)
  @ApiResponse(REPORT_HISTORY_BAD_REQUEST_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  getReportHistory(
    @Query(new ZodValidationPipe(reportHistoryQuerySchema))
    query: ReportHistoryQuery,
    @CurrentUserId() userId: string,
  ) {
    return this.reportHistoryService.getReportHistory(userId, query);
  }
}
