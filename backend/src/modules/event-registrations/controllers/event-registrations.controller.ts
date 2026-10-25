import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { SupportEventIdSchema } from '../requests/support-event-id.request.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';

@ApiTags('Event registrations')
@ApiBearerAuth()
@Controller('event-registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventRegistrationsController {
  constructor(private readonly service: EventRegistrationsService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMine(user.id);
  }

  @Post('support/:eventId')
  @Roles('titulado')
  @ApiOperation({
    summary: 'Apoyar una propuesta de taller',
    description:
      'Registra el apoyo del titulado autenticado. La identidad sale solo del JWT.',
  })
  @ApiParam({ name: 'eventId', description: 'UUID de la propuesta' })
  @ApiResponse({ status: 201, description: 'Apoyo registrado' })
  @ApiResponse({ status: 401, description: 'Sin sesión' })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Apoyo duplicado, propuesta vencida o evento no apoyable',
  })
  support(
    @Param('eventId', new ZodValidationPipe(SupportEventIdSchema))
    eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.support(eventId, user.id);
  }

  @Get('passes/:id')
  @ApiOperation({ summary: 'Consultar pase privado con QR único por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la inscripción/pase' })
  @ApiResponse({ status: 200, description: 'Pase encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado al pase' })
  @ApiResponse({ status: 404, description: 'Pase no encontrado' })
  async getPassById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getPassById(id, user.id);
  }
}