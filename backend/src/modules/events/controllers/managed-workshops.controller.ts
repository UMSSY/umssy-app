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
    operationId: 'getManagedWorkshops',
    summary:
      'Consultar los talleres publicados creados por el titulado autenticado',
    description: 'Requiere sesión con rol titulado. Solo devuelve talleres publicados cuyo creador es el usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Talleres gestionados por el usuario',
    schema: { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: { statusCode: { type: 'integer', example: 200 }, ok: { type: 'boolean', example: true }, detail: { type: 'string', example: 'Operación exitosa' }, data: { type: 'array', items: { type: 'object', required: ['id', 'title', 'eventDate', 'startTime', 'endTime', 'location'], properties: { id: { type: 'string', format: 'uuid' }, title: { type: 'string', example: 'Taller de NestJS' }, eventDate: { type: 'string', format: 'date', example: '2026-11-16' }, startTime: { type: 'string', example: '10:00:00.000' }, endTime: { type: 'string', example: '11:00:00.000' }, location: { type: 'string', nullable: true, example: 'Aula D-101' }, coverUrl: { type: 'string', example: '/events/33333333-3333-4333-8333-333333333333/cover' } } } } } },
  })
  @ApiResponse({ status: 401, description: 'Sesión requerida', schema: { type: 'object', properties: { statusCode: { type: 'integer', example: 401 }, ok: { type: 'boolean', example: false }, code: { type: 'string', example: 'UNAUTHENTICATED' }, detail: { type: 'string', example: 'Se requiere una sesión válida.' }, data: { type: 'object', nullable: true, example: null } } } })
  @ApiResponse({ status: 403, description: 'Rol no permitido', schema: { type: 'object', properties: { statusCode: { type: 'integer', example: 403 }, ok: { type: 'boolean', example: false }, code: { type: 'string', example: 'FORBIDDEN_ROLE' }, detail: { type: 'string', example: 'Rol no permitido.' }, data: { type: 'object', nullable: true, example: null } } } })
  findMine(@CurrentUserId() userId: string) {
    return this.eventsService.findManaged(userId);
  }
}
