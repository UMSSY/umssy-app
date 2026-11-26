import {
  applyDecorators,
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
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
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
  AUDIT_EVENT_DOCUMENT_OK_RESPONSE,
  AUDIT_EVENT_EXPORT_OK_RESPONSE,
  AUDIT_EVENT_FILTER_QUERIES,
  AUDIT_EVENT_ID_PARAM,
  AUDIT_EVENT_LIST_OK_RESPONSE,
  AUDIT_EVENT_PAGINATION_QUERIES,
  AUDIT_EVENT_RESPONSIBLES_OK_RESPONSE,
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

const ApiAuditAuthResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Sesión no autenticada o credencial expirada.',
    }),
    ApiForbiddenResponse({
      description: 'El usuario no cuenta con el rol administrativo.',
    }),
  );

const ApiAuditFilterQueries = () =>
  applyDecorators(...AUDIT_EVENT_FILTER_QUERIES.map((q) => ApiQuery(q)));

const ApiAuditIdEndpoint = () =>
  applyDecorators(
    ApiParam(AUDIT_EVENT_ID_PARAM),
    ApiBadRequestResponse({
      description: 'El identificador del evento no tiene formato UUID válido.',
    }),
    ApiAuditAuthResponses(),
    ApiNotFoundResponse({
      description: 'No se encontró un evento de auditoría con el identificador indicado.',
    }),
  );

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
  @ApiOperation({
    operationId: 'auditEvents_list',
    summary: 'Listar eventos de auditoría',
    description:
      'Consulta de forma paginada los eventos de auditoría con filtros opcionales por texto, acción, responsable y rango de fechas. Solo disponible para el rol administrativo.',
  })
  @ApiAuditFilterQueries()
  @ApiQuery(AUDIT_EVENT_PAGINATION_QUERIES[0])
  @ApiQuery(AUDIT_EVENT_PAGINATION_QUERIES[1])
  @ApiOkResponse(AUDIT_EVENT_LIST_OK_RESPONSE)
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta o rango de fechas inválidos.',
  })
  @ApiAuditAuthResponses()
  list(
    @Query(new ZodValidationPipe(listAuditEventsQuerySchema))
    query: ListAuditEventsQuery,
  ) {
    return this.auditEventsService.list(query);
  }

  @Get('responsibles')
  @ApiOperation({
    operationId: 'auditEvents_listResponsibles',
    summary: 'Listar responsables de auditoría',
    description:
      'Obtiene la lista ordenada de usuarios responsables (y el sistema si existen eventos automáticos) para poblar los filtros de auditoría. Solo disponible para el rol administrativo.',
  })
  @ApiOkResponse(AUDIT_EVENT_RESPONSIBLES_OK_RESPONSE)
  @ApiAuditAuthResponses()
  listResponsibles() {
    return this.auditEventsService.listResponsibles();
  }

  // Va antes de :id/document para que "export" no se lea como identificador
  @Get('export')
  @ApiOperation({
    operationId: 'auditEvents_exportCsv',
    summary: 'Exportar eventos de auditoría en CSV',
    description:
      'Genera y descarga un archivo CSV UTF-8 con todos los eventos de auditoría que coinciden con los filtros aplicados. Solo disponible para el rol administrativo.',
  })
  @ApiAuditFilterQueries()
  @ApiProduces('text/csv')
  @ApiOkResponse(AUDIT_EVENT_EXPORT_OK_RESPONSE)
  @ApiBadRequestResponse({
    description: 'Parámetros de filtro o rango de fechas inválidos.',
  })
  @ApiAuditAuthResponses()
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
    operationId: 'auditEvents_getDetail',
    summary: 'Obtener detalle de un evento de auditoría',
    description:
      'Devuelve el detalle completo de un evento de auditoría, incluyendo solicitud vinculada, solicitante, responsable, motivo de rechazo, tipo de documento y metadatos de evidencia. Solo disponible para el rol administrativo.',
  })
  @ApiAuditIdEndpoint()
  @ApiOkResponse(AUDIT_EVENT_DETAIL_OK_RESPONSE)
  getDetail(@Param('id', uuidPipe) id: string) {
    return this.auditEventsService.getDetail(id);
  }

  @Get(':id/timeline')
  @ApiOperation({
    operationId: 'auditEvents_getTimeline',
    summary: 'Obtener línea de tiempo de un evento de auditoría',
    description:
      'Lista en orden cronológico todos los eventos de auditoría pertenecientes a la solicitud asociada al evento consultado. Solo disponible para el rol administrativo.',
  })
  @ApiAuditIdEndpoint()
  @ApiOkResponse(AUDIT_EVENT_TIMELINE_OK_RESPONSE)
  getTimeline(@Param('id', uuidPipe) id: string) {
    return this.auditEventTimelineService.listForEvent(id);
  }

  @Get(':id/document')
  @ApiOperation({
    operationId: 'auditEvents_getDocument',
    summary: 'Descargar documento de evidencia de un evento de auditoría',
    description:
      'Entrega el archivo binario histórico vinculado como evidencia al evento de auditoría con cabeceras de visualización inline sin caché. Solo disponible para el rol administrativo.',
  })
  @ApiProduces('application/pdf', 'application/octet-stream')
  @ApiAuditIdEndpoint()
  @ApiOkResponse(AUDIT_EVENT_DOCUMENT_OK_RESPONSE)
  @ApiGoneResponse({
    description: 'El archivo de evidencia referenciado ya no está disponible.',
  })
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
