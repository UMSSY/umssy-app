import { GetEventIdSchema } from '../requests/get-event-id.request.js';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard.js';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventsService } from '../services/events.service.js';
import { EventsCatalogService } from '../services/events-catalog.service.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import {
  EVENT_CATALOG_SCOPES,
  EVENT_SORT_OPTIONS,
} from '../constants/events.constants.js';
import { EVENTS_LIST_RESPONSE } from '../constants/events-catalog-swagger.constants.js';
import {
  GetEventsSchema,
  MAX_PAGE_SIZE,
  MAX_SEARCH_LENGTH,
} from '../requests/get-events.request.js';
import type { GetEventsPayload } from '../types/get-events-payload.types.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.types.js';

@ApiTags('Events')
@Controller('events')
@UseGuards(OptionalJwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventsCatalogService: EventsCatalogService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'listEvents',
    summary: 'Listar eventos',
    description:
      'Autenticación opcional. Retorna eventos paginados con sesiones y conteo de inscritos activos. Sin statusId solo incluye talleres que aún no terminaron (con sesiones, hasta el fin de la última). Con sort=recommended sin sesión usa el orden por fecha; con sesión y perfil incompleto usa popular. startTime y endTime representan horas locales de Bolivia.',
    security: [{}, { bearer: [] }],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (mínimo 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: `Resultados por página (máximo ${MAX_PAGE_SIZE})`,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Case-insensitive partial match on event title',
    maxLength: MAX_SEARCH_LENGTH,
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter events by category UUID',
  })
  @ApiQuery({
    name: 'includeProposals',
    required: false,
    type: Boolean,
    description: 'Sin statusId, incluye talleres publicados que aún no terminaron y propuestas en votación. Las propuestas vencidas se consultan mediante statusId.',
    example: true,
  })
  @ApiQuery({
    name: 'statusId',
    required: false,
    type: String,
    description: 'UUID del estado exacto a consultar. Si se envía, este filtro prevalece sobre includeProposals; permite consultar Propuestas vencidas.',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: EVENT_CATALOG_SCOPES,
    description:
      'finished lista solo los talleres que ya terminaron (con sesiones, al finalizar la última), del más reciente al más antiguo. statusId prevalece sobre scope.',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: EVENT_SORT_OPTIONS,
    description:
      'popular ordena por inscritos confirmados; recommended ordena por afinidad con el perfil',
  })
  @ApiResponse(EVENTS_LIST_RESPONSE)
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
  })
  findAll(
    @Query(new ZodValidationPipe(GetEventsSchema)) query: GetEventsPayload,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.eventsCatalogService.findAll(query, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un evento por ID',
    description:
      'Retorna los detalles de un evento específico según su ID. startTime y endTime representan la hora local del evento sin zona horaria.',
  })
  @ApiParam({ name: 'id', description: 'ID o UUID del evento', example: '123' })
  @ApiResponse({ status: 200, description: 'Evento obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  findOne(
    @Param('id', new ZodValidationPipe(GetEventIdSchema))
    id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.eventsService.findOne(id, req.user?.id);
  }
}
