import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  APPOINTMENT_MESSAGES,
  CREATE_APPOINTMENT_DOCS,
} from '../constants/appointment-docs.constants.js';
import { CreateAppointmentDto } from '../requests/create-appointment.request.js';
import { AppointmentsService } from '../services/appointments.service.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';

@Controller('appointments')
@ApiTags('appointments')
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('titulado', 'estudiante')
  @ApiOperation({
    summary: CREATE_APPOINTMENT_DOCS.summary,
    description: CREATE_APPOINTMENT_DOCS.description,
  })
  @ApiCreatedResponse({ description: CREATE_APPOINTMENT_DOCS.createdDescription })
  @ApiBadRequestResponse({
    description: CREATE_APPOINTMENT_DOCS.badRequestDescription,
  })
  @ApiUnauthorizedResponse({ description: APPOINTMENT_MESSAGES.unauthorizedSession })
  @ApiForbiddenResponse({ description: APPOINTMENT_MESSAGES.forbiddenAccess })
  @ApiNotFoundResponse({ description: CREATE_APPOINTMENT_DOCS.notFoundDescription })
  @ApiConflictResponse({ description: CREATE_APPOINTMENT_DOCS.conflictDescription })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAppointmentDto,
  ): Promise<MyAppointmentResponse> {
    return this.appointmentsService.create(user, body);
  }
}
