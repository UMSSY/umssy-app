import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import type { RecommendationsResponse } from '../types/matching.types.js';

@ApiTags('job-offers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard)
@Controller('job-offers')
export class JobRecommendationsController {
  constructor(private readonly jobRecommendationsService: JobRecommendationsService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Recomienda vacantes publicadas según las habilidades del usuario' })
  @ApiOkResponse({ description: 'Vacantes ordenadas por compatibilidad de habilidades' })
  getRecommendations(@CurrentUserId() userId: string): Promise<RecommendationsResponse> {
    return this.jobRecommendationsService.getRecommendations(userId);
  }
}
