import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { cvIdSchema } from '../requests/cv-id.request.js';
import type { CvExtractionResponse } from '../responses/cv-extraction.response.js';
import { CvExtractionService } from '../services/cv-extraction.service.js';

@ApiTags('profile')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard)
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller('profile/me/cvs')
export class CvExtractionController {
  constructor(private readonly cvExtractionService: CvExtractionService) {}

  @Post(':id/extraction')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({
    description:
      'Contact data, education and work experience read from the CV; nothing is saved',
  })
  @ApiNotFoundResponse({ description: 'CV not found for this user' })
  @ApiUnprocessableEntityResponse({
    description:
      'The PDF has no readable text (CV_UNREADABLE, CV_EXTRACTION_FAILED)',
  })
  extract(
    @CurrentUserId() userId: string,
    @Param('id', { schema: cvIdSchema }) id: string,
  ): Promise<CvExtractionResponse> {
    return this.cvExtractionService.extract(userId, id);
  }
}
