import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import type { JobRecommendations } from '../types/job-recommendation.types.js';

@ApiTags('job-matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('job-offers')
export class JobRecommendationsController {
  constructor(private readonly service: JobRecommendationsService) {}

  @Get('recommendations')
  recommendations(
    @CurrentUserId() userId: string,
  ): Promise<JobRecommendations> {
    return this.service.recommendations(userId);
  }
}
