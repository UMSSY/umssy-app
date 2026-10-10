import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { MatchingService } from '../services/matching.service.js';
import {
  AnalyzeExperienceBodyDto,
  analyzeExperienceBodySchema,
  AnalyzeExperienceParamsDto,
} from '../requests/analyze-experience.schema.js';
import type { AnalyzeExperienceResponse } from '../types/matching.types.js';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe.js';

@Controller('work-experiences')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post(':id/skills/analysis')
  @HttpCode(HttpStatus.OK)
  analyzeExperience(
    @Param() params: AnalyzeExperienceParamsDto,
@Body(new ZodValidationPipe(analyzeExperienceBodySchema)) body: AnalyzeExperienceBodyDto,
  ): AnalyzeExperienceResponse {
    return this.matchingService.analyzeExperience({
      experienceId: params.id,
      text: body.text,
    });
  }
}
