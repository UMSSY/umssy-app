import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
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
import { SURVEYS_ROLE } from '../constants/surveys-access.constants.js';
import {
  createSurveySchema,
  type CreateSurveyRequest,
} from '../requests/create-survey.schema.js';
import {
  submitSurveyResponseSchema,
  type SubmitSurveyResponseRequest,
} from '../requests/submit-survey-response.schema.js';
import { surveyIdSchema } from '../requests/survey-id.schema.js';

import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
import type { SurveyDetailResponse } from '../responses/survey-detail.response.js';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';
import type { SurveySummaryResponse } from '../responses/survey-summary.response.js';
import { SurveysService } from '../services/surveys.service.js';

@ApiTags('Encuestas')
@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SURVEYS_ROLE)
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una encuesta de empleabilidad en borrador o publicada' })
  @ApiBody(toApiBody(createSurveySchema))
  @ApiCreatedResponse({ description: 'Encuesta creada' })
  create(
    @Body(new ZodValidationPipe(createSurveySchema)) request: CreateSurveyRequest,
    @CurrentUserId() userId: string,
  ): Promise<SurveyCreatedResponse> {
    return this.surveysService.create(userId, request);
  }

  @Get()
  @ApiOperation({ summary: 'Lista las encuestas de empleabilidad creadas' })
  @ApiOkResponse({ description: 'Encuestas, de la más reciente a la más antigua' })
  list(): Promise<SurveySummaryResponse[]> {
    return this.surveysService.listSurveys();
  }

  @Get(':id')
  @Roles('titulado', 'administrativo')
  @ApiOperation({ summary: 'Obtiene una encuesta con sus preguntas y opciones' })
  @ApiOkResponse({ description: 'Detalle de la encuesta para ser respondida o editada' })
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
  @ApiOperation({ summary: 'Actualiza una encuesta en borrador y permite publicarla' })
  @ApiBody(toApiBody(createSurveySchema))
  @ApiOkResponse({ description: 'Encuesta actualizada' })
  update(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @Body(new ZodValidationPipe(createSurveySchema)) request: CreateSurveyRequest,
  ): Promise<SurveyCreatedResponse> {
    return this.surveysService.update(id, request);
  }

  @Post(':id/responses')
  @Roles('titulado', 'administrativo')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra las respuestas del usuario a una encuesta' })
  @ApiBody(toApiBody(submitSurveyResponseSchema))
  @ApiCreatedResponse({ description: 'Respuestas guardadas' })
  submitResponse(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(submitSurveyResponseSchema)) request: SubmitSurveyResponseRequest,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.surveysService.submitResponse(id, userId, request, user?.roles);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Obtiene las estadísticas y resultados de una encuesta' })
  @ApiOkResponse({ description: 'Estadísticas de la encuesta con desglose de respuestas por opción' })
  statistics(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
  ): Promise<SurveyStatisticsResponse> {
    return this.surveysService.getStatistics(id);
  }

  @Get(':id/export-pdf')
  @ApiOperation({ summary: 'Exporta el informe estadístico de una encuesta en formato PDF' })
  @ApiProduces('application/pdf')
  async exportPdf(
    @Param('id', new ZodValidationPipe(surveyIdSchema)) id: string,
    @CurrentUserId() userId: string,
  ): Promise<StreamableFile> {
    const { fileName, buffer } = await this.surveysService.exportSurveyPdf(id, userId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}

