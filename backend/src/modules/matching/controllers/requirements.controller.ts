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
    description: 'Habilidades detectadas, dentro del envoltorio global de respuesta',
    schema: {
      type: 'object',
      required: ['statusCode', 'ok', 'detail', 'data'],
      properties: {
        statusCode: { type: 'integer', example: 200 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string', example: 'Operación exitosa' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: { type: 'string', example: 'skill-123' },
              name: { type: 'string', example: 'TypeScript' },
            },
          },
        },
      },
      example: {
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: [{ id: 'skill-123', name: 'TypeScript' }],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'El cuerpo de la solicitud no cumple las reglas de validación',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'data', 'detail', 'ok', 'errors'],
      properties: {
        statusCode: { type: 'integer', example: 400 },
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        data: { type: 'array', items: { type: 'object' }, nullable: true },
        detail: { type: 'string', example: 'text: El texto de los requisitos es obligatorio' },
        ok: { type: 'boolean', example: false },
        errors: { type: 'array', items: { type: 'object', additionalProperties: true } },
      },
      example: {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        data: [{ field: 'text', message: 'El texto de los requisitos es obligatorio' }],
        detail: 'text: El texto de los requisitos es obligatorio',
        ok: false,
        errors: [{ field: 'text', message: 'El texto de los requisitos es obligatorio' }],
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene el rol empresa',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'detail', 'ok', 'data'],
      properties: {
        statusCode: { type: 'integer', example: 403 },
        code: { type: 'string', example: 'FORBIDDEN' },
        detail: { type: 'string', example: 'No tienes permiso para realizar esta operación.' },
        ok: { type: 'boolean', example: false },
        data: { type: 'object', nullable: true, example: null },
      },
      example: {
        statusCode: 403,
        code: 'FORBIDDEN',
        detail: 'No tienes permiso para realizar esta operación.',
        ok: false,
        data: null,
      },
    },
  })
  extractTerms(@Body() body: RequirementTermsBodyDto): Promise<DetectedSkillResponse[]> {
    return this.requirementTermsService.extractAndMatchRequirements(body.text);
  }
}
