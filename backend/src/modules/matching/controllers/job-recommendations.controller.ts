import {
  Controller,
  Get,
  Param,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { jobOfferParamsSchema, type JobOfferParams } from '../requests/job-offer-id.schema.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import type { JobFitResponse, RecommendationsResponse } from '../types/matching.types.js';

@ApiTags('job-offers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard)
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller('job-offers')
export class JobRecommendationsController {
  constructor(private readonly jobRecommendationsService: JobRecommendationsService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Recomienda vacantes publicadas según las habilidades del usuario' })
  @ApiOkResponse({ description: 'Vacantes ordenadas por compatibilidad de habilidades' })
  getRecommendations(@CurrentUserId() userId: string): Promise<RecommendationsResponse> {
    return this.jobRecommendationsService.getRecommendations(userId);
  }

  @Get(':id/match')
  @ApiOperation({ summary: 'Afinidad del usuario con una vacante publicada' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Vacante con porcentaje y habilidades que coinciden o faltan' })
  @ApiBadRequestResponse({ description: 'Identificador de vacante inválido' })
  @ApiNotFoundResponse({ description: 'La vacante no existe o no está publicada' })
  getJobFit(
    @CurrentUserId() userId: string,
    @Param({ schema: jobOfferParamsSchema }) params: JobOfferParams,
  ): Promise<JobFitResponse> {
    return this.jobRecommendationsService.getJobFit(userId, params.id);
  }
}
