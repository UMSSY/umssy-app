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
        reference: { type: 'string', minLength: 36, maxLength: 67, description: 'QR v1: seguido de 64 hexadecimales, token de 64 hexadecimales o UUID de inscripción. No se aceptan códigos cortos.', example: '7b8988fd-6818-4929-858b-4d83b72873cf' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Asistencia registrada', schema: { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: { statusCode: { type: 'integer', example: 201 }, ok: { type: 'boolean', example: true }, detail: { type: 'string', example: 'Operación exitosa' }, data: { type: 'object', required: ['result', 'checkedInAt'], properties: { result: { type: 'string', enum: ['registered'], example: 'registered' }, checkedInAt: { type: 'string', format: 'date-time', example: '2026-11-16T14:30:00.000Z' } } } } } })
  @ApiResponse({ status: 200, description: 'Asistencia ya registrada', schema: { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: { statusCode: { type: 'integer', example: 200 }, ok: { type: 'boolean', example: true }, detail: { type: 'string', example: 'Operación exitosa' }, data: { type: 'object', required: ['result', 'checkedInAt'], properties: { result: { type: 'string', enum: ['duplicate'], example: 'duplicate' }, checkedInAt: { type: 'string', format: 'date-time', example: '2026-11-16T14:30:00.000Z' } } } } } })
  @ApiResponse({ status: 400, description: 'Referencia o identificador inválido', schema: { type: 'object', properties: { statusCode: { type: 'integer', example: 400 }, ok: { type: 'boolean', example: false }, code: { type: 'string', example: 'VALIDATION_ERROR' }, detail: { type: 'string', example: 'Solicitud inválida.' }, data: { type: 'object', nullable: true, example: null } } } })
  @ApiResponse({ status: 401, description: 'Sesión requerida', schema: { type: 'object', properties: { statusCode: { type: 'integer', example: 401 }, ok: { type: 'boolean', example: false }, code: { type: 'string', example: 'UNAUTHENTICATED' }, detail: { type: 'string', example: 'Se requiere una sesión válida.' }, data: { type: 'object', nullable: true, example: null } } } })
  @ApiResponse({ status: 403, description: 'Rol o taller no autorizado', schema: { type: 'object', properties: { statusCode: { type: 'integer', example: 403 }, ok: { type: 'boolean', example: false }, code: { type: 'string', enum: ['FORBIDDEN_ROLE', 'ATTENDANCE_ACCESS_DENIED'] }, detail: { type: 'string', example: 'Acceso denegado.' }, data: { type: 'object', nullable: true, example: null } } } })
  @ApiResponse({ status: 409, description: 'Fuera de la ventana horaria del taller', schema: { type: 'object', properties: { statusCode: { type: 'integer', example: 409 }, ok: { type: 'boolean', example: false }, code: { type: 'string', example: 'ATTENDANCE_OUTSIDE_WINDOW' }, detail: { type: 'string', example: 'Fuera de la ventana horaria de validación.' }, data: { type: 'object', nullable: true, example: null } } } })
  @ApiResponse({ status: 422, description: 'Pase inválido o inscripción cancelada', schema: { type: 'object', properties: { statusCode: { type: 'integer', example: 422 }, ok: { type: 'boolean', example: false }, code: { type: 'string', enum: ['ATTENDANCE_PASS_INVALID', 'ATTENDANCE_PASS_CANCELLED'] }, detail: { type: 'string', example: 'Pase inválido.' }, data: { type: 'object', nullable: true, example: null } } } })
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
    return { statusCode, ok: true, detail: 'Operación exitosa', data: result };
  }
}
