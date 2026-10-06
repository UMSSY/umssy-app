import {
  Controller,
  Get,
  Header,
  Query,
  StreamableFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../decorators/response-message.decorator.js';
import { HttpExceptionFilter } from '../filters/http-exception.filter.js';
import { ResponseInterceptor } from '../interceptors/response.interceptor.js';
import {
  RegisteredUsersFiltersDto,
  RegisteredUsersQueryDto,
  RejectedUsersFiltersDto,
  RejectedUsersQueryDto,
} from '../requests/report-users.schema.js';
import { ReportHistoryQueryDto } from '../requests/report-history.schema.js';
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
@UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportHistoryService: ReportHistoryService,
  ) {}

  @Get('registered-users')
  @ResponseMessage('Usuarios registrados obtenidos correctamente')
  getRegisteredUsers(@Query() query: RegisteredUsersQueryDto) {
    return this.reportsService.getRegisteredUsers(query);
  }

  @Get('registered-users/export')
  @ApiProduces('text/csv')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  exportRegisteredUsersCsv(
    @Query() filters: RegisteredUsersFiltersDto,
  ): StreamableFile {
    return toCsvFile(this.reportsService.exportRegisteredUsersCsv(filters));
  }

  @Get('rejected-users')
  @ResponseMessage('Usuarios rechazados obtenidos correctamente')
  getRejectedUsers(@Query() query: RejectedUsersQueryDto) {
    return this.reportsService.getRejectedUsers(query);
  }

  @Get('rejected-users/export')
  @ApiProduces('text/csv')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  exportRejectedUsersCsv(
    @Query() filters: RejectedUsersFiltersDto,
  ): StreamableFile {
    return toCsvFile(this.reportsService.exportRejectedUsersCsv(filters));
  }

  @Get('history')
  @ResponseMessage('Historial de reportes obtenido correctamente')
  getReportHistory(@Query() query: ReportHistoryQueryDto) {
    return this.reportHistoryService.getReportHistory(query);
  }
}
