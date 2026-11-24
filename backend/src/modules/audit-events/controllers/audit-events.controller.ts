import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';

import {
  auditEventsFiltersSchema,
  type AuditEventsFiltersQuery,
} from '../requests/audit-events-filters.schema.js';
import {
  listAuditEventsQuerySchema,
  type ListAuditEventsQuery,
} from '../requests/list-audit-events.schema.js';
import { AuditEventTimelineService } from '../services/audit-event-timeline.service.js';
import { AuditEventsExportService } from '../services/audit-events-export.service.js';
import { AuditEventsService } from '../services/audit-events.service.js';

interface DocumentResponse {
  set: (headers: Record<string, string>) => unknown;
  end: (body: Buffer) => unknown;
}

const uuidPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new RequestValidationException([
      { field: 'id', message: 'El identificador del evento no es válido' },
    ]),
});

// Solo consultas: este controlador no expone rutas para crear, editar ni borrar eventos
@ApiTags('Registro de auditoría')
@Controller('audit-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrativo')
export class AuditEventsController {
  constructor(
    private readonly auditEventsService: AuditEventsService,
    private readonly auditEventsExportService: AuditEventsExportService,
    private readonly auditEventTimelineService: AuditEventTimelineService,
  ) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listAuditEventsQuerySchema))
    query: ListAuditEventsQuery,
  ) {
    return this.auditEventsService.list(query);
  }

  @Get('responsibles')
  listResponsibles() {
    return this.auditEventsService.listResponsibles();
  }

  // Va antes de :id/document para que "export" no se lea como identificador
  @Get('export')
  @ApiProduces('text/csv')
  async export(
    @Query(new ZodValidationPipe(auditEventsFiltersSchema))
    filters: AuditEventsFiltersQuery,
  ): Promise<StreamableFile> {
    const file = await this.auditEventsExportService.exportCsv(filters);
    return new StreamableFile(Buffer.from(file.content, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${file.fileName}"`,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar el detalle de un evento de auditoría',
    description:
      'Devuelve el evento con su acción, fecha, solicitud, persona titulada, responsable, tipo de documento revisado y la evidencia asociada. El motivo solo viaja en los rechazos.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del evento' })
  @ApiResponse({ status: 200, description: 'Detalle del evento' })
  @ApiResponse({ status: 404, description: 'El evento no existe' })
  getDetail(@Param('id', uuidPipe) id: string) {
    return this.auditEventsService.getDetail(id);
  }

  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Consultar el historial de la solicitud de un evento',
    description:
      'Resuelve la solicitud a la que pertenece el evento y devuelve sus eventos en orden cronológico ascendente, junto al identificador del evento consultado para poder resaltarlo.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del evento consultado' })
  @ApiResponse({ status: 200, description: 'Historial de la solicitud' })
  @ApiResponse({ status: 404, description: 'El evento no existe' })
  getTimeline(@Param('id', uuidPipe) id: string) {
    return this.auditEventTimelineService.listForEvent(id);
  }

  @Get(':id/document')
  async getDocument(
    @Param('id', uuidPipe) id: string,
    @Res() response: DocumentResponse,
  ): Promise<void> {
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
