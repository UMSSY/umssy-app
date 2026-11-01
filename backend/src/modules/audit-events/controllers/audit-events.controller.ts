import { Controller, Get, Param, ParseUUIDPipe, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { AUDIT_ROLE } from '../constants/audit-events.constants.js';
import { auditEventsFiltersSchema, type AuditEventsFiltersQuery } from '../requests/audit-events-filters.schema.js';
import { listAuditEventsQuerySchema, type ListAuditEventsQuery } from '../requests/list-audit-events.schema.js';
import { AuditEventsExportService } from '../services/audit-events-export.service.js';
import { AuditEventsService } from '../services/audit-events.service.js';

interface DocumentResponse {
  set: (headers: Record<string, string>) => unknown;
  end: (body: Buffer) => unknown;
}

const uuidPipe = new ParseUUIDPipe({
  exceptionFactory: () => new RequestValidationException([{ field: 'id', message: 'El identificador del evento no es válido' }]),
});

// Solo consultas: este controlador no expone rutas para crear, editar ni borrar eventos
@ApiTags('Registro de auditoría')
@Controller('audit-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AUDIT_ROLE)
export class AuditEventsController {
  constructor(
    private readonly auditEventsService: AuditEventsService,
    private readonly auditEventsExportService: AuditEventsExportService,
  ) {}

  @Get()
  list(@Query(new ZodValidationPipe(listAuditEventsQuerySchema)) query: ListAuditEventsQuery) {
    return this.auditEventsService.list(query);
  }

  @Get('responsibles')
  listResponsibles() {
    return this.auditEventsService.listResponsibles();
  }

  // Va antes de :id/document para que "export" no se lea como identificador
  @Get('export')
  @ApiProduces('text/csv')
  async export(@Query(new ZodValidationPipe(auditEventsFiltersSchema)) filters: AuditEventsFiltersQuery): Promise<StreamableFile> {
    const file = await this.auditEventsExportService.exportCsv(filters);
    return new StreamableFile(Buffer.from(file.content, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${file.fileName}"`,
    });
  }

  @Get(':id/document')
  async getDocument(@Param('id', uuidPipe) id: string, @Res() response: DocumentResponse): Promise<void> {
    const file = await this.auditEventsService.getDocument(id);
    response.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.content.length),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(`${file.name}.${file.extension}`)}`,
      'Cache-Control': 'private, no-store',
    });
    response.end(file.content);
  }
}
