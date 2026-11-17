import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import {
  RequirementTermsBodyDto,
  requirementTermsBodySchema,
} from '../requests/requirement-terms.schema.js';
import { RequirementTermsService } from '../services/requirement-terms.service.js';
import type { DetectedSkillResponse } from '../types/matching.types.js';

@ApiTags('matching')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('empresa')
@Controller('matching/requirements')
export class RequirementsController {
  constructor(private readonly requirementTermsService: RequirementTermsService) {}

  @Post('terms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extrae habilidades de los requisitos de una vacante',
    operationId: 'extractRequirementTerms',
  })
  @ApiBody(toApiBody(requirementTermsBodySchema))
  @ApiOkResponse({
    description: 'Habilidades detectadas y asociadas a sus identificadores',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'El cuerpo de la solicitud no cumple las reglas de validación',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene el rol empresa',
  })
  extractTerms(@Body() body: RequirementTermsBodyDto): Promise<DetectedSkillResponse[]> {
    return this.requirementTermsService.extractAndMatchRequirements(body.text);
  }
}
