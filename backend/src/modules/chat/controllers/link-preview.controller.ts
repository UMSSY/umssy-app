import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import { LinkPreviewService } from '../services/link-preview.service.js';
import {
  linkPreviewQuerySchema,
  type LinkPreviewQueryDto,
} from '../requests/link-preview.schema.js';
import type { LinkPreviewResponse } from '../responses/link-preview.response.js';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat/link-preview')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante', 'mentor', 'empresa')
@UseInterceptors(ResponseInterceptor)
export class LinkPreviewController {
  constructor(private readonly linkPreviewService: LinkPreviewService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener vista previa de un enlace web seguro' })
  @ApiQuery({
    name: 'url',
    required: true,
    type: String,
    description: 'URL pública del enlace a inspeccionar (http o https)',
    example: 'https://github.com',
  })
  @ApiResponse({
    status: 200,
    description:
      'Vista previa obtenida con éxito (o tarjeta vacía si la página no tiene metadatos)',
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida o no permitida',
  })
  @ApiResponse({
    status: 403,
    description:
      'Acceso bloqueado hacia redes internas o privadas (protección SSRF)',
  })
  getPreview(
    @Query(new ZodValidationPipe(linkPreviewQuerySchema))
    query: LinkPreviewQueryDto,
  ): Promise<LinkPreviewResponse> {
    return this.linkPreviewService.getPreview(query.url);
  }
}
