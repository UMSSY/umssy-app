import {
  Body,
  Controller,
  Header,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { ValidationException } from '../../../common/exceptions/validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  AttendanceCheckInBodySchema,
  AttendanceCheckInParamsSchema,
} from '../requests/attendance-check-in.request.js';
import type {
  AttendanceCheckInBody,
  AttendanceCheckInParams,
} from '../requests/attendance-check-in.request.js';
import { AttendanceCheckInService } from '../services/attendance-check-in.service.js';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado')
@Controller('events/:eventId/attendances')
export class AttendanceCheckInController {
  constructor(private readonly service: AttendanceCheckInService) {}

  @Post('check-ins')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ operationId: 'checkInWorkshopAttendance', summary: 'Registrar asistencia en línea', description: 'Requiere sesión de titulado creador del taller publicado. La referencia solo se busca dentro del taller y la hora la fija el servidor.' })
  @ApiParam({ name: 'eventId', format: 'uuid', description: 'UUID del taller publicado', example: '33333333-3333-4333-8333-333333333333' })
  @ApiBody({
    examples: {
      qr: { summary: 'QR del pase', value: { reference: `v1:${'a'.repeat(64)}` } },
      token: { summary: 'Token del pase', value: { reference: 'a'.repeat(64) } },
      manual: { summary: 'ID de inscripción', value: { reference: '7b8988fd-6818-4929-858b-4d83b72873cf' } },
    },
    schema: {
      type: 'object',
      required: ['reference'],
      additionalProperties: false,
      properties: {
        reference: { type: 'string', oneOf: [
          { pattern: '^[Vv]1:[A-Fa-f0-9]{64}$', minLength: 67, maxLength: 67 },
          { pattern: '^[A-Fa-f0-9]{64}$', minLength: 64, maxLength: 64 },
          { format: 'uuid', pattern: '^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$', minLength: 36, maxLength: 36 },
        ], description: 'QR v1, token hexadecimal de 64 caracteres o UUID de inscripción. No se aceptan códigos cortos.', example: '7b8988fd-6818-4929-858b-4d83b72873cf' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Asistencia registrada', headers: { 'Cache-Control': { description: 'Respuesta privada sin caché', schema: { type: 'string', example: 'private, no-store' } } }, schema: { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: { statusCode: { type: 'integer', example: 201 }, ok: { type: 'boolean', example: true }, detail: { type: 'string', example: 'Operación exitosa' }, data: { type: 'object', required: ['result', 'checkedInAt'], properties: { result: { type: 'string', enum: ['registered'], example: 'registered' }, checkedInAt: { type: 'string', format: 'date-time', example: '2026-11-16T14:30:00.000Z' } } } } } })
  @ApiResponse({ status: 200, description: 'Asistencia ya registrada', headers: { 'Cache-Control': { description: 'Respuesta privada sin caché', schema: { type: 'string', example: 'private, no-store' } } }, schema: { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: { statusCode: { type: 'integer', example: 200 }, ok: { type: 'boolean', example: true }, detail: { type: 'string', example: 'Operación exitosa' }, data: { type: 'object', required: ['result', 'checkedInAt'], properties: { result: { type: 'string', enum: ['duplicate'], example: 'duplicate' }, checkedInAt: { type: 'string', format: 'date-time', example: '2026-11-16T14:30:00.000Z' } } } } } })
  @ApiResponse({ status: 400, description: 'Referencia o identificador inválido', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 400, ok: false, code: 'VALIDATION_ERROR', detail: 'Solicitud inválida.', data: null } })
  @ApiResponse({ status: 401, description: 'Sesión requerida', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 401, ok: false, code: 'UNAUTHENTICATED', detail: 'Se requiere una sesión válida.', data: null } })
  @ApiResponse({ status: 403, description: 'Rol o taller no autorizado', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 403, ok: false, code: 'ATTENDANCE_ACCESS_DENIED', detail: 'Acceso denegado.', data: null } })
  @ApiResponse({ status: 409, description: 'Fuera de la ventana horaria del taller', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 409, ok: false, code: 'ATTENDANCE_OUTSIDE_WINDOW', detail: 'Fuera de la ventana horaria de validación.', data: null } })
  @ApiResponse({ status: 422, description: 'Pase inválido o inscripción cancelada', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 422, ok: false, code: 'ATTENDANCE_PASS_INVALID', detail: 'Pase inválido.', data: null } })
  @ApiResponse({ status: 500, description: 'Error interno al registrar asistencia', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 500, ok: false, code: 'INTERNAL_ERROR', detail: 'Error interno del servidor.', data: null } })
  async checkIn(
    @Param(new ZodValidationPipe(AttendanceCheckInParamsSchema, () => new ValidationException()))
    params: AttendanceCheckInParams,
    @Body(new ZodValidationPipe(AttendanceCheckInBodySchema, () => new ValidationException()))
    body: AttendanceCheckInBody,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.checkIn(params.eventId, actor, body.reference.value);
    const statusCode = result.result === 'registered' ? 201 : 200;
    response.status(statusCode);
    return result;
  }
}
