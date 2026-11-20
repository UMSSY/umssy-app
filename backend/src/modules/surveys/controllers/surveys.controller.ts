import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  FORBIDDEN_ROLE_RESPONSE,
  INTERNAL_ERROR_RESPONSE,
  UNAUTHENTICATED_RESPONSE,
} from '../../../common/constants/api-error-swagger.constants.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import {
  SURVEY_RESPONDENT_ROLES,
  SURVEYS_ROLE,
} from '../constants/surveys-access.constants.js';
import {
  SURVEY_GET_ALERT_CONFIG_DESCRIPTION,
  SURVEY_GET_ALERT_CONFIG_OK_RESPONSE,
  SURVEY_GET_PARTICIPATION_DESCRIPTION,
  SURVEY_GET_PARTICIPATION_OK_RESPONSE,
  SURVEY_SAVE_ALERT_CONFIG_BAD_REQUEST_RESPONSE,
  SURVEY_SAVE_ALERT_CONFIG_BODY_EXAMPLES,
  SURVEY_SAVE_ALERT_CONFIG_DESCRIPTION,
  SURVEY_SAVE_ALERT_CONFIG_OK_RESPONSE,
  SURVEY_SEND_REMINDERS_BAD_GATEWAY_RESPONSE,
  SURVEY_SEND_REMINDERS_BAD_REQUEST_RESPONSE,
  SURVEY_SEND_REMINDERS_CONFLICT_RESPONSE,
  SURVEY_SEND_REMINDERS_DESCRIPTION,
  SURVEY_SEND_REMINDERS_OK_RESPONSE,
} from '../constants/survey-monitoring-swagger.constants.js';
import {
  SURVEY_ALREADY_ANSWERED_RESPONSE,
  SURVEY_CREATE_BAD_REQUEST_RESPONSE,
  SURVEY_CREATE_CONFLICT_RESPONSE,
  SURVEY_CREATE_DESCRIPTION,
  SURVEY_CREATE_NOT_FOUND_RESPONSE,
  SURVEY_CREATED_RESPONSE,
  SURVEY_DETAIL_BAD_REQUEST_RESPONSE,
  SURVEY_DETAIL_DESCRIPTION,
  SURVEY_DETAIL_OK_RESPONSE,
  SURVEY_LIST_DESCRIPTION,
  SURVEY_LIST_OK_RESPONSE,
  SURVEY_NOT_AVAILABLE_RESPONSE,
  SURVEY_REPORT_DESCRIPTION,
  SURVEY_REPORT_NOT_FOUND_RESPONSE,
  SURVEY_REPORT_OK_RESPONSE,
  SURVEY_RESPONDENT_NOT_FOUND_RESPONSE,
  SURVEY_STATISTICS_BAD_REQUEST_RESPONSE,
  SURVEY_STATISTICS_DESCRIPTION,
  SURVEY_STATISTICS_OK_RESPONSE,
  SURVEY_STATISTICS_PERIOD_QUERY,
  SURVEY_SUBMIT_BAD_REQUEST_RESPONSE,
  SURVEY_SUBMIT_RESPONSE_BODY_EXAMPLES,
  SURVEY_SUBMIT_RESPONSE_DESCRIPTION,
  SURVEY_SUBMITTED_RESPONSE,
  SURVEY_UNPUBLISH_CONFLICT_RESPONSE,
  SURVEY_UNPUBLISH_DESCRIPTION,
  SURVEY_UNPUBLISHED_RESPONSE,
  SURVEY_UPDATE_BAD_REQUEST_RESPONSE,
  SURVEY_UPDATE_CONFLICT_RESPONSE,
  SURVEY_UPDATE_DESCRIPTION,
  SURVEY_UPDATE_NOT_FOUND_RESPONSE,
  SURVEY_UPDATED_RESPONSE,
  SURVEY_UPSERT_BODY_EXAMPLES,
} from '../constants/survey-management-swagger.constants.js';
import {
  SURVEY_ID_PARAM,
  SURVEY_INVALID_ID_RESPONSE,
  SURVEY_NOT_FOUND_RESPONSE,
  SURVEYS_STORAGE_UNAVAILABLE_RESPONSE,
} from '../constants/survey-swagger.constants.js';
import {
  createSurveySchema,
  type CreateSurveyRequest,
} from '../requests/create-survey.schema.js';
import {
  submitSurveyResponseSchema,
  type SubmitSurveyResponseRequest,
} from '../requests/submit-survey-response.schema.js';
import { surveyAlertConfigSchema } from '../requests/survey-alert-config.schema.js';
import { sendSurveyReminderSchema } from '../requests/send-survey-reminder.schema.js';
import { surveyIdSchema } from '../requests/survey-id.schema.js';
import {
  surveyStatisticsQuerySchema,
  type SurveyStatisticsQuery,
} from '../requests/survey-statistics-query.schema.js';

import type { SurveyAlertConfigResponse } from '../responses/survey-alert-config.response.js';
import type { SurveyAlertConfigSavedResponse } from '../responses/survey-alert-config-saved.response.js';
import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
import type { SurveyDetailResponse } from '../responses/survey-detail.response.js';
import type { SurveyParticipationResponse } from '../responses/survey-participation.response.js';
import type { SurveyReminderResponse } from '../responses/survey-reminder.response.js';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';
import type { SurveySummaryResponse } from '../responses/survey-summary.response.js';
import { SurveyParticipationService } from '../services/survey-participation.service.js';
import { SurveysService } from '../services/surveys.service.js';
import type { SendSurveyReminderRequest } from '../types/send-survey-reminder-request.type.js';
import type { SurveyAlertConfigDto } from '../types/survey-alert-config-dto.type.js';

@ApiTags('Encuestas')
@ApiBearerAuth()
@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SURVEYS_ROLE)
export class SurveysController {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly surveyParticipationService: SurveyParticipationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createSurvey',
    summary: 'Crea una encuesta de empleabilidad en borrador o publicada',
    description: SURVEY_CREATE_DESCRIPTION,
  })
  @ApiBody({
    ...toApiBody(createSurveySchema),
    examples: SURVEY_UPSERT_BODY_EXAMPLES,
  })
  @ApiResponse(SURVEY_CREATED_RESPONSE)
  @ApiResponse(SURVEY_CREATE_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_CREATE_NOT_FOUND_RESPONSE)
  @ApiResponse(SURVEY_CREATE_CONFLICT_RESPONSE)
  @ApiResponse(SURVEYS_STORAGE_UNAVAILABLE_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  create(
    @Body(new ZodValidationPipe(createSurveySchema))
    request: CreateSurveyRequest,
    @CurrentUserId() userId: string,
  ): Promise<SurveyCreatedResponse> {
    return this.surveysService.create(userId, request);
  }

  @Get()
  @ApiOperation({
    operationId: 'listSurveys',
    summary: 'Lista las encuestas de empleabilidad creadas',
    description: SURVEY_LIST_DESCRIPTION,
  })
  @ApiResponse(SURVEY_LIST_OK_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  list(): Promise<SurveySummaryResponse[]> {
    return this.surveysService.listSurveys();
  }

  @Get(':id')
  @Roles(...SURVEY_RESPONDENT_ROLES, SURVEYS_ROLE)
  @ApiOperation({
    operationId: 'getSurvey',
    summary: 'Obtiene una encuesta con sus preguntas y opciones',
    description: SURVEY_DETAIL_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiResponse(SURVEY_DETAIL_OK_RESPONSE)
  @ApiResponse(SURVEY_DETAIL_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_NOT_AVAILABLE_RESPONSE)
  @ApiResponse(SURVEY_RESPONDENT_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  getById(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @CurrentUserId() userId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<SurveyDetailResponse> {
    return this.surveysService.getSurveyForAnswering(id, userId, user?.roles);
  }

  detail(id: string): Promise<SurveyDetailResponse> {
    return this.surveysService.getDetail(id);
  }

  @Patch(':id')
  @ApiOperation({
    operationId: 'updateSurvey',
    summary: 'Actualiza una encuesta en borrador y permite publicarla',
    description: SURVEY_UPDATE_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiBody({
    ...toApiBody(createSurveySchema),
    examples: SURVEY_UPSERT_BODY_EXAMPLES,
  })
  @ApiResponse(SURVEY_UPDATED_RESPONSE)
  @ApiResponse(SURVEY_UPDATE_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_UPDATE_NOT_FOUND_RESPONSE)
  @ApiResponse(SURVEY_UPDATE_CONFLICT_RESPONSE)
  @ApiResponse(SURVEYS_STORAGE_UNAVAILABLE_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  update(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Body(new ZodValidationPipe(createSurveySchema))
    request: CreateSurveyRequest,
  ): Promise<SurveyCreatedResponse> {
    return this.surveysService.update(id, request);
  }

  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'unpublishSurvey',
    summary:
      'Inhabilita una encuesta publicada sin respuestas y la devuelve a borrador',
    description: SURVEY_UNPUBLISH_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiResponse(SURVEY_UNPUBLISHED_RESPONSE)
  @ApiResponse(SURVEY_INVALID_ID_RESPONSE)
  @ApiResponse(SURVEY_NOT_FOUND_RESPONSE)
  @ApiResponse(SURVEY_UNPUBLISH_CONFLICT_RESPONSE)
  @ApiResponse(SURVEYS_STORAGE_UNAVAILABLE_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  unpublish(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
  ): Promise<void> {
    return this.surveysService.unpublish(id);
  }

  @Post(':id/responses')
  @Roles(...SURVEY_RESPONDENT_ROLES, SURVEYS_ROLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'submitSurveyResponse',
    summary: 'Registra las respuestas del usuario a una encuesta',
    description: SURVEY_SUBMIT_RESPONSE_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiBody({
    ...toApiBody(submitSurveyResponseSchema),
    examples: SURVEY_SUBMIT_RESPONSE_BODY_EXAMPLES,
  })
  @ApiResponse(SURVEY_SUBMITTED_RESPONSE)
  @ApiResponse(SURVEY_SUBMIT_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_NOT_AVAILABLE_RESPONSE)
  @ApiResponse(SURVEY_RESPONDENT_NOT_FOUND_RESPONSE)
  @ApiResponse(SURVEY_ALREADY_ANSWERED_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  submitResponse(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(submitSurveyResponseSchema))
    request: SubmitSurveyResponseRequest,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.surveysService.submitResponse(id, userId, request, user?.roles);
  }

  @Get(':id/statistics')
  @ApiOperation({
    operationId: 'getSurveyStatistics',
    summary: 'Obtiene las estadísticas y resultados de una encuesta',
    description: SURVEY_STATISTICS_DESCRIPTION,
  })
  @ApiQuery(SURVEY_STATISTICS_PERIOD_QUERY)
  @ApiParam(SURVEY_ID_PARAM)
  @ApiResponse(SURVEY_STATISTICS_OK_RESPONSE)
  @ApiResponse(SURVEY_STATISTICS_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  statistics(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Query(new ZodValidationPipe(surveyStatisticsQuerySchema))
    { period }: SurveyStatisticsQuery,
  ): Promise<SurveyStatisticsResponse> {
    return this.surveysService.getStatistics(id, period);
  }

  @Get(':id/report')
  @ApiOperation({
    operationId: 'exportSurveyReport',
    summary: 'Exporta el informe estadístico de una encuesta en formato PDF',
    description: SURVEY_REPORT_DESCRIPTION,
  })
  @ApiProduces('application/pdf')
  @ApiQuery(SURVEY_STATISTICS_PERIOD_QUERY)
  @ApiParam(SURVEY_ID_PARAM)
  @ApiResponse(SURVEY_REPORT_OK_RESPONSE)
  @ApiResponse(SURVEY_STATISTICS_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_REPORT_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  async exportPdf(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Query(new ZodValidationPipe(surveyStatisticsQuerySchema))
    { period }: SurveyStatisticsQuery,
    @CurrentUserId() userId: string,
  ): Promise<StreamableFile> {
    const { fileName, buffer } = await this.surveysService.exportSurveyPdf(
      id,
      userId,
      period,
    );
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  @Get(':id/alert-config')
  @ApiOperation({
    operationId: 'getSurveyAlertConfig',
    summary: 'Obtiene la configuración de alertas de variación de la encuesta',
    description: SURVEY_GET_ALERT_CONFIG_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiResponse(SURVEY_GET_ALERT_CONFIG_OK_RESPONSE)
  @ApiResponse(SURVEY_INVALID_ID_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  getAlertConfig(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
  ): Promise<SurveyAlertConfigResponse> {
    return this.surveysService.getAlertConfig(id);
  }

  @Put(':id/alert-config')
  @ApiOperation({
    operationId: 'saveSurveyAlertConfig',
    summary: 'Guarda la configuración de alertas de variación de la encuesta',
    description: SURVEY_SAVE_ALERT_CONFIG_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiBody({
    ...toApiBody(surveyAlertConfigSchema),
    examples: SURVEY_SAVE_ALERT_CONFIG_BODY_EXAMPLES,
  })
  @ApiResponse(SURVEY_SAVE_ALERT_CONFIG_OK_RESPONSE)
  @ApiResponse(SURVEY_SAVE_ALERT_CONFIG_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  saveAlertConfig(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Body(new ZodValidationPipe(surveyAlertConfigSchema))
    request: SurveyAlertConfigDto,
  ): Promise<SurveyAlertConfigSavedResponse> {
    return this.surveysService.saveAlertConfig(id, request);
  }

  @Get(':id/participation')
  @ApiOperation({
    operationId: 'getSurveyParticipation',
    summary:
      'Obtiene la cobertura de participación de la audiencia objetivo de la encuesta',
    description: SURVEY_GET_PARTICIPATION_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiResponse(SURVEY_GET_PARTICIPATION_OK_RESPONSE)
  @ApiResponse(SURVEY_INVALID_ID_RESPONSE)
  @ApiResponse(SURVEY_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  getParticipation(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
  ): Promise<SurveyParticipationResponse> {
    return this.surveyParticipationService.getParticipation(id);
  }

  @Post(':id/reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'sendSurveyReminders',
    summary:
      'Envía recordatorios por correo y push solo a la audiencia que aún no respondió',
    description: SURVEY_SEND_REMINDERS_DESCRIPTION,
  })
  @ApiParam(SURVEY_ID_PARAM)
  @ApiBody({
    ...toApiBody(sendSurveyReminderSchema),
    required: false,
    examples: { empty: { summary: 'Cuerpo vacío', value: {} } },
  })
  @ApiResponse(SURVEY_SEND_REMINDERS_OK_RESPONSE)
  @ApiResponse(SURVEY_SEND_REMINDERS_BAD_REQUEST_RESPONSE)
  @ApiResponse(SURVEY_NOT_FOUND_RESPONSE)
  @ApiResponse(SURVEY_SEND_REMINDERS_CONFLICT_RESPONSE)
  @ApiResponse(SURVEY_SEND_REMINDERS_BAD_GATEWAY_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  sendReminders(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Body(new ZodValidationPipe(sendSurveyReminderSchema))
    _request: SendSurveyReminderRequest,
    @CurrentUserId() userId: string,
  ): Promise<SurveyReminderResponse> {
    return this.surveyParticipationService.sendReminders(id, userId);
  }
}
