import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { APPOINTMENT_RESPONSE_SCHEMA } from '../constants/appointment-docs.constants.js';
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
  description: 'La sesión es requerida o no es válida',
})
@ApiForbiddenResponse({
  description: 'El usuario no tiene acceso a las citas solicitadas',
})
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Consulta las citas propias próximas o pasadas',
    description:
      'Incluye citas confirmadas y confirmaciones heredadas, normalizadas a CONFIRMED',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['upcoming', 'past'],
    description:
      'Por defecto upcoming; la clasificación utiliza la hora de fin de la cita',
    schema: { default: 'upcoming' },
  })
  @ApiBadRequestResponse({
    description: 'Los parámetros de consulta no son válidos',
  })
  @ApiOkResponse({
    description: 'Citas propias con horarios UTC y nombre de la contraparte',
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
    summary: 'Consulta una cita únicamente si el usuario participa en ella',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador de la cita',
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la cita no es válido',
  })
  @ApiNotFoundResponse({ description: 'La cita no existe' })
  @ApiOkResponse({
    description: 'Detalle de una cita del participante autenticado',
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
