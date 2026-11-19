import { MENTOR_PHOTO_ERROR_SCHEMA } from '../responses/mentor-photo-error.response.js';
import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiProduces,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { MentorPhotoService } from '../services/mentor-photo.service.js';

@ApiTags('mentors')
@Controller('mentors')
export class MentorPhotoController {
  constructor(private readonly mentorPhotoService: MentorPhotoService) {}

  @ApiOperation({
    operationId: 'getMentorPhoto',
    summary: 'Descargar fotografía',
    description:
      'Público, sin Bearer ni roles. Mentor activo y foto reconocida. Carga normal JPEG/PNG; descarga también reconoce PDF almacenado. Binario fuera del envoltorio JSON.',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID v4.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Binario inline.',
    content: {
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
    headers: {
      'Cache-Control': { schema: { type: 'string', enum: ['no-store'] } },
      'Content-Disposition': { schema: { type: 'string', enum: ['inline'] } },
      'Content-Length': { schema: { type: 'integer', minimum: 0 } },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'UUID v4 inválido.',
    schema: {
      ...MENTOR_PHOTO_ERROR_SCHEMA,
      example: {
        statusCode: 400,
        ok: false,
        code: 'VALIDATION_ERROR',
        detail: 'No se pudo completar la solicitud.',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'MENTOR_NOT_FOUND, PROFILE_NOT_FOUND o PHOTO_NOT_FOUND.',
    schema: {
      ...MENTOR_PHOTO_ERROR_SCHEMA,
      example: {
        statusCode: 404,
        ok: false,
        code: 'PHOTO_NOT_FOUND',
        detail: 'No se pudo completar la solicitud.',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'INTERNAL_ERROR.',
    schema: {
      ...MENTOR_PHOTO_ERROR_SCHEMA,
      example: {
        statusCode: 500,
        ok: false,
        code: 'INTERNAL_ERROR',
        detail: 'No se pudo completar la solicitud.',
        data: null,
      },
    },
  })
  @Get(':userId/photo')
  @Header('Cache-Control', 'no-store')
  @ApiProduces('image/png', 'image/jpeg', 'application/pdf')
  async download(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<StreamableFile> {
    const photo = await this.mentorPhotoService.getPhoto(userId);

    return new StreamableFile(photo.content, {
      type: photo.mimeType,
      disposition: 'inline',
      length: photo.content.length,
    });
  }
}
