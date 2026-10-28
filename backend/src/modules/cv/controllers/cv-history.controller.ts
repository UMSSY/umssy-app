import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  StandardSchemaValidationPipe,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import type { PaginatedResult } from '../../../common/types/api-response.types.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import {
  CV_DEFAULT_PAGE_SIZE,
  CV_FIELD_NAME,
  CV_UPLOAD_LIMIT_BYTES,
} from '../constants/cv.constants.js';
import { cvIdSchema } from '../requests/cv-id.request.js';
import { listCvsSchema, type ListCvsRequest } from '../requests/list-cvs.request.js';
import type { CvResponse } from '../responses/cv.response.js';
import { CvService } from '../services/cv.service.js';

@ApiTags('profile')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@ApiBadRequestResponse({ description: 'Invalid pagination, identifier or file' })
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller('profile/me/cvs')
export class CvHistoryController {
  constructor(private readonly cvService: CvService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: CV_DEFAULT_PAGE_SIZE })
  @ApiOkResponse({ description: 'CVs of the authenticated user, newest first, without content' })
  list(
    @CurrentUserId() userId: string,
    @Query({ schema: listCvsSchema }) request: ListCvsRequest,
  ): Promise<PaginatedResult<CvResponse>> {
    return this.cvService.list(userId, request);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor(CV_FIELD_NAME, {
      limits: { fileSize: CV_UPLOAD_LIMIT_BYTES, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [CV_FIELD_NAME],
      properties: {
        [CV_FIELD_NAME]: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Uploaded CV, which becomes the current one' })
  upload(
    @CurrentUserId() userId: string,
    @UploadedFile() file: MulterFile | undefined,
  ): Promise<CvResponse | null> {
    return this.cvService.upload(userId, file);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'CV deleted; the response data is null' })
  @ApiNotFoundResponse({ description: 'CV not found for this user' })
  async remove(
    @CurrentUserId() userId: string,
    @Param('id', { schema: cvIdSchema }) id: string,
  ): Promise<null> {
    await this.cvService.removeById(userId, id);
    return null;
  }
}
