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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';

import {
  AUDIT_EVENT_DETAIL_OK_RESPONSE,
  AUDIT_EVENT_ID_PARAM,
  AUDIT_EVENT_TIMELINE_OK_RESPONSE,
} from '../constants/audit-events-openapi.constants.js';
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
@ApiBearerAuth()
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
    summary: 'Obtener detalle de un evento de auditoría',
    description:
      'Devuelve el detalle completo de un evento de auditoría, incluyendo solicitud vinculada, solicitante, responsable, motivo de rechazo, tipo de documento y metadatos de evidencia. Solo disponible para el rol administrativo.',
  })
  @ApiParam(AUDIT_EVENT_ID_PARAM)
  @ApiOkResponse(AUDIT_EVENT_DETAIL_OK_RESPONSE)
  @ApiBadRequestResponse({
    description: 'El identificador del evento no tiene formato UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Sesión no autenticada o credencial expirada.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no cuenta con el rol administrativo.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un evento de auditoría con el identificador indicado.',
  })
  getDetail(@Param('id', uuidPipe) id: string) {
    return this.auditEventsService.getDetail(id);
  }

  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Obtener línea de tiempo de un evento de auditoría',
    description:
      'Lista en orden cronológico todos los eventos de auditoría pertenecientes a la solicitud asociada al evento consultado. Solo disponible para el rol administrativo.',
  })
  @ApiParam(AUDIT_EVENT_ID_PARAM)
  @ApiOkResponse(AUDIT_EVENT_TIMELINE_OK_RESPONSE)
  @ApiBadRequestResponse({
    description: 'El identificador del evento no tiene formato UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Sesión no autenticada o credencial expirada.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no cuenta con el rol administrativo.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un evento de auditoría con el identificador indicado.',
  })
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
