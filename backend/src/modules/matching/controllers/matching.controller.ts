import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { MatchingService } from '../services/matching.service.js';
import {
  AnalyzeExperienceBodyDto,
  AnalyzeExperienceParamsDto,
} from '../requests/analyze-experience.schema.js';
import {
  apiAnalyzeExperienceSkills,
  apiPreviewExperienceSkills,
} from '../swagger/matching.swagger.js';
import type { AnalyzeExperienceResponse } from '../types/matching.types.js';

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-experiences')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post(':id/skills/analysis')
  @HttpCode(HttpStatus.OK)
  @apiAnalyzeExperienceSkills()
  analyzeExperience(
    @CurrentUserId() userId: string,
    @Param() params: AnalyzeExperienceParamsDto,
    @Body() body: AnalyzeExperienceBodyDto,
  ): Promise<AnalyzeExperienceResponse> {
    return this.matchingService.analyzeExperience(userId, {
      experienceId: params.id,
      text: body.text,
    });
  }

  @Post(':id/skills/preview')
  @HttpCode(HttpStatus.OK)
  @apiPreviewExperienceSkills()
  previewExperience(
    @CurrentUserId() userId: string,
    @Param() params: AnalyzeExperienceParamsDto,
    @Body() body: AnalyzeExperienceBodyDto,
  ): Promise<AnalyzeExperienceResponse> {
    return this.matchingService.previewExperience(userId, {
      experienceId: params.id,
      text: body.text,
    });
  }
}
