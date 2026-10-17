import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RequirementTermsBodyDto } from '../requests/requirement-terms.schema.js';
import { RequirementTermsService } from '../services/requirement-terms.service.js';
import type { RequirementTermsResponse } from '../types/matching.types.js';

@ApiTags('matching')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard)
@Controller('matching/requirements')
export class RequirementsController {
  constructor(private readonly requirementTermsService: RequirementTermsService) {}

  @Post('terms')
  @HttpCode(HttpStatus.OK)
  extractTerms(@Body() body: RequirementTermsBodyDto): RequirementTermsResponse {
    return this.requirementTermsService.extract(body.text);
  }
}
