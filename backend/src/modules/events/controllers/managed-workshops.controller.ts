import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { EventsService } from '../services/events.service.js';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado')
@Controller('events/managed')
export class ManagedWorkshopsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary:
      'Consultar los talleres publicados creados por el titulado autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Talleres gestionados por el usuario',
  })
  @ApiResponse({ status: 401, description: 'Sesión requerida' })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  findMine(@CurrentUserId() userId: string) {
    return this.eventsService.findManaged(userId);
  }
}
