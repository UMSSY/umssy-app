import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
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
}
