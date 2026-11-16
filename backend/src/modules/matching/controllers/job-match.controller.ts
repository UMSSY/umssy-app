import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobMatchParamsDto } from '../requests/job-match.schema.js';
import { JobMatchService } from '../services/job-match.service.js';
import { apiGetJobOfferMatch } from '../swagger/matching.swagger.js';
import type { JobMatchResponse } from '../types/job-match.types.js';

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('job-offers')
export class JobMatchController {
  constructor(private readonly jobMatchService: JobMatchService) {}

  @Get(':id/match')
  @apiGetJobOfferMatch()
  getMatch(
    @CurrentUserId() userId: string,
    @Param() params: JobMatchParamsDto,
  ): Promise<JobMatchResponse> {
    return this.jobMatchService.getMatch(userId, params.id);
  }
}
