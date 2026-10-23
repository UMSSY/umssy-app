import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
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
import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
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

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Obtiene las estadísticas y resultados de una encuesta' })
  @ApiOkResponse({ description: 'Estadísticas de la encuesta con desglose de respuestas por opción' })
  statistics(@Param('id') id: string): Promise<SurveyStatisticsResponse> {
    return this.surveysService.getStatistics(id);
  }

  @Get(':id/export-pdf')
  @ApiOperation({ summary: 'Exporta el informe estadístico de una encuesta en formato PDF' })
  @ApiProduces('application/pdf')
  async exportPdf(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<StreamableFile> {
    const { fileName, buffer } = await this.surveysService.exportSurveyPdf(id, userId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}
