import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  APPOINTMENT_MESSAGES,
  APPOINTMENT_RESPONSE_SCHEMA,
  CREATE_APPOINTMENT_DOCS,
  FIND_APPOINTMENT_DOCS,
  FIND_MY_APPOINTMENTS_DOCS,
} from '../constants/appointment-docs.constants.js';
import { CreateAppointmentDto } from '../requests/create-appointment.request.js';
import { appointmentIdSchema } from '../requests/appointment-id.request.js';
import { myAppointmentsQuerySchema } from '../requests/my-appointments-query.request.js';
import { AppointmentsService } from '../services/appointments.service.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';
import type { MyAppointmentsQuery } from '../types/my-appointments-query.types.js';

@Controller('appointments')
@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('mentor', 'titulado', 'estudiante')
@ApiUnauthorizedResponse({
  description: APPOINTMENT_MESSAGES.unauthorizedSession,
})
@ApiForbiddenResponse({
  description: APPOINTMENT_MESSAGES.forbiddenAccess,
})
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('titulado', 'estudiante')
  @ApiOperation({
    summary: CREATE_APPOINTMENT_DOCS.summary,
    description: CREATE_APPOINTMENT_DOCS.description,
  })
  @ApiCreatedResponse({ description: CREATE_APPOINTMENT_DOCS.createdDescription })
  @ApiBadRequestResponse({
    description: CREATE_APPOINTMENT_DOCS.badRequestDescription,
  })
  @ApiNotFoundResponse({ description: CREATE_APPOINTMENT_DOCS.notFoundDescription })
  @ApiConflictResponse({ description: CREATE_APPOINTMENT_DOCS.conflictDescription })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAppointmentDto,
  ): Promise<MyAppointmentResponse> {
    return this.appointmentsService.create(user, body);
  }

  @Get('me')
  @ApiOperation({
    summary: FIND_MY_APPOINTMENTS_DOCS.summary,
    description: FIND_MY_APPOINTMENTS_DOCS.description,
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['upcoming', 'past'],
    description: FIND_MY_APPOINTMENTS_DOCS.scopeDescription,
    schema: { default: 'upcoming' },
  })
  @ApiBadRequestResponse({
    description: FIND_MY_APPOINTMENTS_DOCS.invalidQueryDescription,
  })
  @ApiOkResponse({
    description: FIND_MY_APPOINTMENTS_DOCS.responseDescription,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 200 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string' },
        data: { type: 'array', items: APPOINTMENT_RESPONSE_SCHEMA },
      },
    },
  })
  findMine(
    @CurrentUserId() userId: string,
    @Query(new RequestValidationPipe(myAppointmentsQuerySchema))
    query: MyAppointmentsQuery,
  ): Promise<MyAppointmentResponse[]> {
    return this.appointmentsService.findMine(userId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: FIND_APPOINTMENT_DOCS.summary,
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: FIND_APPOINTMENT_DOCS.idDescription,
  })
  @ApiBadRequestResponse({
    description: FIND_APPOINTMENT_DOCS.invalidIdDescription,
  })
  @ApiNotFoundResponse({
    description: FIND_APPOINTMENT_DOCS.notFoundDescription,
  })
  @ApiOkResponse({
    description: FIND_APPOINTMENT_DOCS.responseDescription,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 200 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string' },
        data: APPOINTMENT_RESPONSE_SCHEMA,
      },
    },
  })
  findOne(
    @CurrentUserId() userId: string,
    @Param('id', new RequestValidationPipe(appointmentIdSchema)) id: string,
  ): Promise<MyAppointmentResponse> {
    return this.appointmentsService.findOne(userId, id);
  }
}
