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
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
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
    summary: 'Crea una encuesta de empleabilidad en borrador o publicada',
  })
  @ApiBody(toApiBody(createSurveySchema))
  @ApiCreatedResponse({ description: 'Encuesta creada' })
  create(
    @Body(new ZodValidationPipe(createSurveySchema))
    request: CreateSurveyRequest,
    @CurrentUserId() userId: string,
  ): Promise<SurveyCreatedResponse> {
    return this.surveysService.create(userId, request);
  }

  @Get()
  @ApiOperation({ summary: 'Lista las encuestas de empleabilidad creadas' })
  @ApiOkResponse({
    description: 'Encuestas, de la más reciente a la más antigua',
  })
  list(): Promise<SurveySummaryResponse[]> {
    return this.surveysService.listSurveys();
  }

  @Get(':id')
  @Roles(...SURVEY_RESPONDENT_ROLES, SURVEYS_ROLE)
  @ApiOperation({
    summary: 'Obtiene una encuesta con sus preguntas y opciones',
  })
  @ApiOkResponse({
    description: 'Detalle de la encuesta para ser respondida o editada',
  })
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
    summary: 'Actualiza una encuesta en borrador y permite publicarla',
  })
  @ApiBody(toApiBody(createSurveySchema))
  @ApiOkResponse({ description: 'Encuesta actualizada' })
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
    summary:
      'Inhabilita una encuesta publicada sin respuestas y la devuelve a borrador',
  })
  @ApiNoContentResponse({
    description: 'Encuesta devuelta a borrador para su corrección',
  })
  unpublish(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
  ): Promise<void> {
    return this.surveysService.unpublish(id);
  }

  @Post(':id/responses')
  @Roles(...SURVEY_RESPONDENT_ROLES, SURVEYS_ROLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra las respuestas del usuario a una encuesta',
  })
  @ApiBody(toApiBody(submitSurveyResponseSchema))
  @ApiCreatedResponse({ description: 'Respuestas guardadas' })
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
    summary: 'Obtiene las estadísticas y resultados de una encuesta',
  })
  @ApiOkResponse({
    description:
      'Estadísticas de la encuesta con desglose de respuestas por opción',
  })
  statistics(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Query(new ZodValidationPipe(surveyStatisticsQuerySchema))
    { period }: SurveyStatisticsQuery,
  ): Promise<SurveyStatisticsResponse> {
    return this.surveysService.getStatistics(id, period);
  }

  @Get(':id/report')
  @ApiOperation({
    summary: 'Exporta el informe estadístico de una encuesta en formato PDF',
  })
  @ApiProduces('application/pdf')
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
    summary: 'Obtiene la configuración de alertas de variación de la encuesta',
  })
  @ApiOkResponse({ description: 'Configuración de alertas' })
  getAlertConfig(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
  ): Promise<SurveyAlertConfigResponse> {
    return this.surveysService.getAlertConfig(id);
  }

  @Put(':id/alert-config')
  @ApiOperation({
    summary: 'Guarda la configuración de alertas de variación de la encuesta',
  })
  @ApiBody(toApiBody(surveyAlertConfigSchema))
  @ApiOkResponse({ description: 'Configuración guardada' })
  saveAlertConfig(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Body(new ZodValidationPipe(surveyAlertConfigSchema))
    request: SurveyAlertConfigDto,
  ): Promise<SurveyAlertConfigSavedResponse> {
    return this.surveysService.saveAlertConfig(id, request);
  }

  @Get(':id/participation')
  @ApiOperation({
    summary:
      'Obtiene la cobertura de participación de la audiencia objetivo de la encuesta',
  })
  @ApiOkResponse({ description: 'Estado de participación de la encuesta' })
  getParticipation(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
  ): Promise<SurveyParticipationResponse> {
    return this.surveyParticipationService.getParticipation(id);
  }

  @Post(':id/reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Envía recordatorios por correo y push solo a la audiencia que aún no respondió',
  })
  @ApiBody(toApiBody(sendSurveyReminderSchema))
  @ApiOkResponse({ description: 'Resultado del envío de recordatorios' })
  sendReminders(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Body(new ZodValidationPipe(sendSurveyReminderSchema))
    _request: SendSurveyReminderRequest,
    @CurrentUserId() userId: string,
  ): Promise<SurveyReminderResponse> {
    return this.surveyParticipationService.sendReminders(id, userId);
  }
}
