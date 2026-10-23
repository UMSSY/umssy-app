import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import type {
  JobMatch,
  JobRecommendations,
} from '../types/job-recommendation.types.js';

@ApiTags('job-matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('job-offers')
export class JobRecommendationsController {
  constructor(private readonly service: JobRecommendationsService) {}

  @Get('recommendations')
  recommendations(
    @CurrentUserId() userId: string,
  ): Promise<JobRecommendations> {
    return this.service.recommendations(userId);
  }

  @Get(':id/match')
  detail(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) offerId: string,
  ): Promise<JobMatch> {
    return this.service.detail(userId, offerId);
  }
}
