import { Body, Controller, Get, HttpCode, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  FORBIDDEN_ROLE_RESPONSE,
  UNAUTHENTICATED_RESPONSE,
} from '../../../common/constants/api-error-swagger.constants.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import {
  JOB_ALERT_GET_DESCRIPTION,
  JOB_ALERT_GET_OK_RESPONSE,
  JOB_ALERT_PUT_DESCRIPTION,
  JOB_ALERT_PUT_OK_RESPONSE,
  JOB_ALERT_SKILLS_REQUIRED_RESPONSE,
  JOB_ALERT_VALIDATION_RESPONSE,
} from '../constants/job-alert-preference-swagger.constants.js';
import {
  jobAlertPreferenceSchema,
  type JobAlertPreferenceRequest,
} from '../requests/job-alert-preference.schema.js';
import { JobAlertPreferencesService } from '../services/job-alert-preferences.service.js';
import type { JobAlertPreference } from '../types/job-alert-preference.types.js';

@ApiTags('job-matching')
@ApiBearerAuth()
@ApiResponse(UNAUTHENTICATED_RESPONSE)
@ApiResponse(FORBIDDEN_ROLE_RESPONSE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('job-offers/alert-preference')
export class JobAlertPreferencesController {
  constructor(private readonly service: JobAlertPreferencesService) {}

  @Get()
  @ApiOperation({
    operationId: 'getJobAlertPreference',
    summary: 'Consultar de qué vacantes nuevas quiere recibir aviso la persona autenticada',
    description: JOB_ALERT_GET_DESCRIPTION,
  })
  @ApiResponse(JOB_ALERT_GET_OK_RESPONSE)
  get(@CurrentUserId() userId: string): Promise<JobAlertPreference> {
    return this.service.get(userId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'saveJobAlertPreference',
    summary: 'Guardar de qué vacantes nuevas quiere recibir aviso la persona autenticada',
    description: JOB_ALERT_PUT_DESCRIPTION,
  })
  @ApiBody(toApiBody(jobAlertPreferenceSchema))
  @ApiResponse(JOB_ALERT_PUT_OK_RESPONSE)
  @ApiResponse(JOB_ALERT_VALIDATION_RESPONSE)
  @ApiResponse(JOB_ALERT_SKILLS_REQUIRED_RESPONSE)
  update(
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(jobAlertPreferenceSchema))
    request: JobAlertPreferenceRequest,
  ): Promise<JobAlertPreference> {
    return this.service.update(userId, request.mode);
  }
}
