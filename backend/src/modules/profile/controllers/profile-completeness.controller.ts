import {
  Controller,
  Get,
  Header,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import {
  PROFILE_COMPLETENESS_MAX_PERCENTAGE,
  PROFILE_COMPLETENESS_SECTIONS,
} from '../constants/profile-completeness.constants.js';
import type { ProfileCompletenessResponse } from '../responses/profile-completeness.response.js';
import { ProfileCompletenessService } from '../services/profile-completeness.service.js';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('profile')
export class ProfileCompletenessController {
  constructor(private readonly completeness: ProfileCompletenessService) {}

  @Get('completeness')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Calculate the completeness of the authenticated profile',
    description:
      'Contact and presentation must satisfy their existing form validation. ' +
      'Education, work experience, skills and certifications require at least one saved record. ' +
      'Saved skills count regardless of source or verification status. ' +
      'CV requires at least one stored PDF with an upload date; downloading a generated CV does not save it. ' +
      'Contact, presentation, education, work experience, skills and CV each contribute 15%; certifications contribute 10%. ' +
      'Each completed section contributes its full weight; incomplete sections contribute zero. ' +
      'Photos, unsaved drafts and document approval do not affect this percentage.',
  })
  @ApiOkResponse({
    description: 'Weighted completeness and section breakdown',
    schema: {
      type: 'object',
      required: ['statusCode', 'ok', 'detail', 'data'],
      properties: {
        statusCode: { type: 'integer', enum: [HttpStatus.OK] },
        ok: { type: 'boolean', enum: [true] },
        detail: { type: 'string', example: 'OK' },
        data: {
          type: 'object',
          required: ['percentage', 'sections'],
          properties: {
            percentage: {
              type: 'integer',
              minimum: 0,
              maximum: PROFILE_COMPLETENESS_MAX_PERCENTAGE,
            },
            sections: {
              type: 'array',
              minItems: PROFILE_COMPLETENESS_SECTIONS.length,
              maxItems: PROFILE_COMPLETENESS_SECTIONS.length,
              items: {
                type: 'object',
                required: ['id', 'weight', 'isCompleted'],
                properties: {
                  id: {
                    type: 'string',
                    enum: PROFILE_COMPLETENESS_SECTIONS.map(
                      (section) => section.id,
                    ),
                  },
                  weight: {
                    type: 'integer',
                    enum: [
                      ...new Set(
                        PROFILE_COMPLETENESS_SECTIONS.map(
                          (section) => section.weight,
                        ),
                      ),
                    ],
                  },
                  isCompleted: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid session' })
  @ApiNotFoundResponse({ description: 'User profile not found' })
  getCompleteness(
    @CurrentUserId() userId: string,
  ): Promise<ProfileCompletenessResponse> {
    return this.completeness.getCompleteness(userId);
  }
}
