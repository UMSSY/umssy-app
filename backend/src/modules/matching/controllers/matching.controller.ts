import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ExperienceAnalysisService } from '../services/experience-analysis.service.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import {
  analyzeExperienceBodySchema,
  analyzeExperienceParamsSchema,
  AnalyzeExperienceBodyDto,
  AnalyzeExperienceParamsDto,
} from '../requests/analyze-experience.schema.js';
import type { AnalyzeExperienceResponse } from '../types/matching.types.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';

@Controller('work-experiences')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MatchingController {
  constructor(private readonly matchingService: ExperienceAnalysisService) {}

  @Post(':id/skills/analysis')
  @HttpCode(HttpStatus.OK)
  analyzeExperience(
    @CurrentUserId() userId: string,
    @Param(new RequestValidationPipe(analyzeExperienceParamsSchema))
    params: AnalyzeExperienceParamsDto,
    @Body(new RequestValidationPipe(analyzeExperienceBodySchema))
    body: AnalyzeExperienceBodyDto,
  ): Promise<AnalyzeExperienceResponse> {
    return this.matchingService.analyze(userId, {
      experienceId: params.id,
      text: body.text,
    });
  }
}
