import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { SupportEventIdSchema } from '../requests/support-event-id.request.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { ValidationException } from '../../../common/exceptions/validation.exception.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import { RegistrationResponses } from '../decorators/registration-responses.decorator.js';
import { EVENT_REGISTRATION_PARAMS_SCHEMA, REGISTRATION_ID_SCHEMA, REGISTRATION_PARAMS_SCHEMA } from '../requests/registration-params.schema.js';
import type { EventRegistrationParams } from '../types/event-registration-params.types.js';
import type { RegistrationIdParam } from '../types/registration-id-param.types.js';
import type { RegistrationParams } from '../types/registration-params.types.js';
import { REGISTRATION_BODY_SCHEMA } from '../requests/registration-body.schema.js';
import { CREATE_EVENT_REGISTRATION_BODY_SCHEMA } from '../requests/create-event-registration-body.schema.js';
import type { CreateEventRegistrationBody } from '../types/create-event-registration-body.types.js';

@ApiTags('Registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EventRegistrationsController {
  constructor(private readonly registrationsService: EventRegistrationsService) {}

  @Post('events/:eventId/registrations')
  @UseGuards(RolesGuard)
  @Roles('titulado')
  @HttpCode(201)
  @ApiOperation({ summary: 'Inscribirse o reactivar una inscripción', description: 'Sin cuerpo de solicitud. El usuario se obtiene de la sesión.' })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @RegistrationResponses(201)
  create(
    @Param(new ZodValidationPipe(EVENT_REGISTRATION_PARAMS_SCHEMA, () => new ValidationException())) params: EventRegistrationParams,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(REGISTRATION_BODY_SCHEMA, () => new ValidationException())) _body: unknown,
  ) {
    return this.registrationsService.create(params.eventId, userId);
  }

  @Get('events/:eventId/registrations/me')
  @ApiOperation({ summary: 'Consultar la inscripción propia, incluida una inscripción cancelada' })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @RegistrationResponses(200)
  findOwn(
    @Param(new ZodValidationPipe(EVENT_REGISTRATION_PARAMS_SCHEMA, () => new ValidationException())) params: EventRegistrationParams,
    @CurrentUserId() userId: string,
  ) {
    return this.registrationsService.findOwn(params.eventId, userId);
  }

  @Delete('registrations/:registrationId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar una inscripción propia mediante baja lógica' })
  @ApiParam({ name: 'registrationId', format: 'uuid' })
  @RegistrationResponses(200)
  cancel(
    @Param(new ZodValidationPipe(REGISTRATION_PARAMS_SCHEMA, () => new ValidationException())) params: RegistrationParams,
    @CurrentUserId() userId: string,
  ) {
    return this.registrationsService.cancel(params.registrationId, userId);
  }

  @Post('event-registrations')
  @UseGuards(RolesGuard)
  @Roles('titulado')
  @HttpCode(201)
  @ApiOperation({ summary: 'Inscribir al usuario autenticado en un evento mediante su identificador en el cuerpo' })
  @RegistrationResponses(201)
  createWithBody(
    @Body(new ZodValidationPipe(CREATE_EVENT_REGISTRATION_BODY_SCHEMA, () => new ValidationException())) body: CreateEventRegistrationBody,
    @CurrentUserId() userId: string,
  ) {
    return this.registrationsService.create(body.eventId, userId);
  }

  @Delete('event-registrations/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar una inscripción propia mediante baja lógica usando su identificador' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @RegistrationResponses(200)
  cancelById(
    @Param(new ZodValidationPipe(REGISTRATION_ID_SCHEMA, () => new ValidationException())) params: RegistrationIdParam,
    @CurrentUserId() userId: string,
  ) {
    return this.registrationsService.cancel(params.id, userId);
  }
  @Get('event-registrations/me')
  @ApiOperation({ summary: 'Consultar los pases activos del usuario' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.registrationsService.findMine(user.id);
  }
  @Post('event-registrations/support/:eventId')
  @UseGuards(RolesGuard)
  @Roles('titulado')
  @ApiOperation({ summary: 'Apoyar una propuesta de taller con el usuario de la sesión' })
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @HttpCode(201)
  support(
    @Param('eventId', new ZodValidationPipe(SupportEventIdSchema, () => new ValidationException())) eventId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.registrationsService.support(eventId, userId);
  }

  @Get('event-registrations/passes/:id')
  @ApiOperation({ summary: 'Consultar el pase privado de una inscripción activa de un evento publicado' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getPassById(
    @Param('id', new ZodValidationPipe(SupportEventIdSchema, () => new ValidationException())) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.registrationsService.getPassById(id, userId);
  }

}
