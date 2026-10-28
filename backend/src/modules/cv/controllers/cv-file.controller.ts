import {
  Controller,
  Get,
  Param,
  StandardSchemaValidationPipe,
  StreamableFile,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { cvIdSchema } from '../requests/cv-id.request.js';
import { CvService } from '../services/cv.service.js';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller('profile/me/cvs')
export class CvFileController {
  constructor(private readonly cvService: CvService) {}

  @Get(':id/file')
  @ApiProduces('application/pdf')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNotFoundResponse({ description: 'CV not found for this user' })
  async downloadById(
    @CurrentUserId() userId: string,
    @Param('id', { schema: cvIdSchema }) id: string,
  ): Promise<StreamableFile> {
    const download = await this.cvService.getFileById(userId, id);
    return new StreamableFile(download.content, {
      type: download.mimeType,
      disposition: `inline; filename="${download.fileName}"`,
      length: download.content.length,
    });
  }
}
