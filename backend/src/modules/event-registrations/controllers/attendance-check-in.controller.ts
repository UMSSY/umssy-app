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
import { ApiBearerAuth, ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reference'],
      additionalProperties: false,
      properties: {
        reference: { type: 'string', description: 'QR v1, token de 64 caracteres o UUID de inscripción' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Asistencia registrada' })
  @ApiResponse({ status: 200, description: 'Asistencia ya registrada' })
  @ApiResponse({ status: 400, description: 'Referencia o identificador inválido' })
  @ApiResponse({ status: 401, description: 'Sesión requerida' })
  @ApiResponse({ status: 403, description: 'Taller no gestionado por el usuario' })
  @ApiResponse({ status: 422, description: 'Pase inválido o inscripción cancelada' })
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
    // This route has two success statuses; provide the matching envelope explicitly.
    return { statusCode, ok: true, detail: 'Operación exitosa', data: result };
  }
}
