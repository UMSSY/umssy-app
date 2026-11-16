import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RequirementTermsBodyDto } from '../requests/requirement-terms.schema.js';
import { RequirementTermsService } from '../services/requirement-terms.service.js';
import { apiExtractRequirementTerms } from '../swagger/matching.swagger.js';
import type { DetectedSkillResponse } from '../types/matching.types.js';

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matching/requirements')
export class RequirementsController {
  constructor(
    private readonly requirementTermsService: RequirementTermsService,
  ) {}

  @Post('terms')
  @HttpCode(HttpStatus.OK)
  @apiExtractRequirementTerms()
  extractTerms(
    @Body() body: RequirementTermsBodyDto,
  ): Promise<DetectedSkillResponse[]> {
    return this.requirementTermsService.extractAndMatchRequirements(body.text);
  }
}
