import { mentorApiOperation } from '../decorators/mentor-api-operation.decorator.js';
import { MENTOR_API_SCHEMAS } from '../responses/mentor-openapi.response.js';
import { ApiTags, ApiBody, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { toApiBody } from '../../../common/utils/to-api-body.js';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  createMentorParticipationSchema,
  type CreateMentorParticipationDto,
} from '../requests/create-mentor-participation.schema.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';
import { requireMentorIdempotencyKey } from '../requests/mentor-idempotency-key.schema.js';

const parsePositiveInteger = (
  value: string | undefined,
  defaultValue: number,
  field: string,
  maximum: number,
): number => {
  if (value === undefined) {
    return defaultValue;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(
      `El parámetro ${field} debe ser un número entero positivo`,
    );
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new BadRequestException(
      `El parámetro ${field} debe estar entre 1 y ${maximum}`,
    );
  }

  return parsed;
};

@ApiTags('mentor-participation')
@Controller('mentor-participation/requests')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MentorParticipationController {
  constructor(private readonly service: MentorParticipationService) {}

  @mentorApiOperation({
    operationId: 'createMentorParticipationRequest',
    summary: 'Solicitar un cupo',
    description:
      'Titulado aprobado; espera cuando no hay cupos. 400 preferencias/clave inválidas; 403 no elegible; 409 REQUEST_ALREADY_EXISTS, CAPACITY_AVAILABLE o IDEMPOTENCY_KEY_CONFLICT; 429 MENTOR_REQUEST_SUSPENDED.',
    data: MENTOR_API_SCHEMAS.request,
    example: {
      id: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      userId: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      status: 'PENDING',
      queuedAt: '2026-11-17T12:00:00.000Z',
      createdAt: '2026-11-17T12:00:00.000Z',
      technicalAreaIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'],
      orientationTypeIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'],
    },
    auth: true,
    errors: [400, 409, 429],
    status: 201,
  })
  @ApiBody(toApiBody(createMentorParticipationSchema))
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'UUID no nulo ni máximo. Reutilizar la clave con otras preferencias produce 409. El quinto intento puede iniciar sanción de 72 horas (429).',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
  })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createMentorParticipationSchema))
    body: CreateMentorParticipationDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.service.create(user.id, body, requireMentorIdempotencyKey(key));
  }

  @mentorApiOperation({
    operationId: 'getMyMentorParticipationRequest',
    summary: 'Consultar solicitud actual',
    description:
      'Sesión activa, cualquier rol válido. Última solicitud por queuedAt DESC e ID DESC con oferta y correo; puede devolver null. Solo usuario autenticado.',
    data: MENTOR_API_SCHEMAS.currentRequest,
    example: null,
    auth: true,
    errors: [],
    status: 200,
  })
  @Get('me')
  findMyRequest(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMyRequest(user.id);
  }

  @mentorApiOperation({
    operationId: 'getMyMentorParticipationHistory',
    summary: 'Consultar historial propio',
    description:
      'Sesión activa, cualquier rol válido. queuedAt DESC e ID DESC. Sin page ni limit: array legado; con cualquiera: items/page/limit/total/totalPages.',
    data: MENTOR_API_SCHEMAS.history,
    example: [],
    auth: true,
    errors: [400],
    status: 200,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 1000000, default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
  })
  @Get('me/history')
  findMyHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (page === undefined && limit === undefined) {
      return this.service.findMyHistory(user.id);
    }

    const requestedPage = parsePositiveInteger(page, 1, 'page', 1000000);
    const requestedLimit = parsePositiveInteger(limit, 10, 'limit', 100);

    return this.service.findMyHistoryPaginated(
      user.id,
      requestedPage,
      requestedLimit,
    );
  }

  @mentorApiOperation({
    operationId: 'updateMyMentorParticipationRequest',
    summary: 'Editar preferencias pendientes',
    description:
      'Sesión activa; solo solicitud PENDING propia. 404 si no existe; 400 preferencias inválidas. Conserva posición FIFO.',
    data: MENTOR_API_SCHEMAS.updatedRequest,
    example: {
      id: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      userId: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      status: 'PENDING',
      queuedAt: '2026-11-17T12:00:00.000Z',
      createdAt: '2026-11-17T12:00:00.000Z',
      technicalAreaIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'],
      orientationTypeIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'],
      updatedAt: '2026-11-17T12:00:00.000Z',
      statusId: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
    auth: true,
    errors: [400, 404],
    status: 200,
  })
  @ApiBody(toApiBody(createMentorParticipationSchema))
  @Patch('me')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createMentorParticipationSchema))
    body: CreateMentorParticipationDto,
  ) {
    return this.service.updatePreferences(user.id, body);
  }

  @mentorApiOperation({
    operationId: 'cancelMyMentorParticipationRequest',
    summary: 'Cancelar solicitud pendiente',
    description:
      'Sesión activa; cancela solicitud PENDING propia. 404 si no existe; retorna solicitud CANCELLED.',
    data: MENTOR_API_SCHEMAS.updatedRequest,
    example: {
      id: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      userId: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      status: 'CANCELLED',
      queuedAt: '2026-11-17T12:00:00.000Z',
      createdAt: '2026-11-17T12:00:00.000Z',
      technicalAreaIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'],
      orientationTypeIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'],
      updatedAt: '2026-11-17T12:00:00.000Z',
      statusId: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
    auth: true,
    errors: [404],
    status: 200,
  })
  @Delete('me')
  cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.service.cancel(user.id);
  }
}
