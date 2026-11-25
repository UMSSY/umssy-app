import {
  applyDecorators,
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
import {
  ATTENDANCE_CHECK_IN_BODY,
  ATTENDANCE_CHECK_IN_ERROR_RESPONSES,
} from '../constants/attendance-check-in-swagger.constants.js';

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
  @ApiBody(ATTENDANCE_CHECK_IN_BODY)
  @ApiResponse({ status: 201, description: 'Asistencia registrada', headers: { 'Cache-Control': { description: 'Respuesta privada sin caché', schema: { type: 'string', example: 'private, no-store' } } }, schema: { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: { statusCode: { type: 'integer', example: 201 }, ok: { type: 'boolean', example: true }, detail: { type: 'string', example: 'Operación exitosa' }, data: { type: 'object', required: ['result', 'checkedInAt', 'sessionId'], properties: { result: { type: 'string', enum: ['registered'], example: 'registered' }, checkedInAt: { type: 'string', format: 'date-time', example: '2026-11-16T14:30:00.000Z' }, sessionId: { type: 'string', format: 'uuid', nullable: true, example: '44444444-4444-4444-8444-444444444444' } } } } } })
  @ApiResponse({ status: 200, description: 'Asistencia ya registrada', headers: { 'Cache-Control': { description: 'Respuesta privada sin caché', schema: { type: 'string', example: 'private, no-store' } } }, schema: { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: { statusCode: { type: 'integer', example: 200 }, ok: { type: 'boolean', example: true }, detail: { type: 'string', example: 'Operación exitosa' }, data: { type: 'object', required: ['result', 'checkedInAt', 'sessionId'], properties: { result: { type: 'string', enum: ['duplicate'], example: 'duplicate' }, checkedInAt: { type: 'string', format: 'date-time', example: '2026-11-16T14:30:00.000Z' }, sessionId: { type: 'string', format: 'uuid', nullable: true, example: '44444444-4444-4444-8444-444444444444' } } } } } })
  @applyDecorators(...ATTENDANCE_CHECK_IN_ERROR_RESPONSES.map((options) => ApiResponse(options)))
  async checkIn(
    @Param(new ZodValidationPipe(AttendanceCheckInParamsSchema, () => new ValidationException()))
    params: AttendanceCheckInParams,
    @Body(new ZodValidationPipe(AttendanceCheckInBodySchema, () => new ValidationException()))
    body: AttendanceCheckInBody,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.checkIn(params.eventId, actor, body.reference.value, body.sessionId);
    const statusCode = result.result === 'registered' ? 201 : 200;
    response.status(statusCode);
    return result;
  }
}
