import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import type { ProfileSkillsAnalysisResponse } from '../responses/profile-skills-analysis.response.js';
import type { ProfileSkillsRadarResponse } from '../responses/profile-skills-radar.response.js';
import { ProfileSkillsAnalysisService } from '../services/profile-skills-analysis.service.js';

@ApiTags('nlp')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid session' })
@ApiNotFoundResponse({ description: 'User profile not found' })
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('profile')
export class ProfileSkillsAnalysisController {
  constructor(private readonly analysisService: ProfileSkillsAnalysisService) {}

  @Get('skills-for-radar')
  @ApiOkResponse({ description: 'Verified skills of the authenticated user, as stored by the last analysis' })
  getSkillsForRadar(@CurrentUserId() userId: string): Promise<ProfileSkillsRadarResponse> {
    return this.analysisService.getRadarSnapshot(userId);
  }

  @Post('me/skills/analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Runs the skill analysis again and returns the stored result' })
  analyzeSkills(@CurrentUserId() userId: string): Promise<ProfileSkillsAnalysisResponse> {
    return this.analysisService.analyzeNow(userId);
  }
}
