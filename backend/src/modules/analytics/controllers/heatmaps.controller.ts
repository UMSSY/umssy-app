import {
  Controller,
  Get,
  Param,
  Query,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  FORBIDDEN_ROLE_RESPONSE,
  INTERNAL_ERROR_RESPONSE,
  UNAUTHENTICATED_RESPONSE,
} from '../../../common/constants/api-error-swagger.constants.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import {
  HEATMAP_BAD_REQUEST_RESPONSE,
  HEATMAP_EXPORT_AUTHOR_NOT_FOUND_RESPONSE,
  HEATMAP_EXPORT_FORMAT_QUERY,
  HEATMAP_EXPORT_OK_RESPONSE,
  HEATMAP_EXPORT_OPERATION_DESCRIPTION,
  HEATMAP_OK_RESPONSE,
  HEATMAP_OPERATION_DESCRIPTION,
  HEATMAP_QUERY,
  HEATMAP_TYPE_PARAM,
} from '../constants/heatmap-swagger.constants.js';
import { heatmapExportQuerySchema } from '../requests/heatmap-export-query.schema.js';
import { heatmapParamsSchema } from '../requests/heatmap-params.schema.js';
import { heatmapQuerySchema } from '../requests/heatmap-query.schema.js';
import { HeatmapPdfService } from '../services/heatmap-pdf.service.js';
import { HeatmapsService } from '../services/heatmaps.service.js';
import type { HeatmapExportQuery } from '../types/heatmap-export-query.types.js';
import type { HeatmapParams } from '../types/heatmap-params.types.js';
import type { HeatmapQuery } from '../types/heatmap-query.types.js';

@ApiTags('Analíticas')
@ApiBearerAuth()
@Controller('analytics/heatmap')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrativo')
export class HeatmapsController {
  constructor(
    private readonly heatmapsService: HeatmapsService,
    private readonly heatmapPdfService: HeatmapPdfService,
  ) {}

  @Get(':type')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({
    operationId: 'getAnalyticsHeatmap',
    summary: 'Obtiene un mapa de calor de habilidades de los titulados',
    description: HEATMAP_OPERATION_DESCRIPTION,
  })
  @ApiQuery(HEATMAP_QUERY.endTimestamp)
  @ApiQuery(HEATMAP_QUERY.startTimestamp)
  @ApiQuery(HEATMAP_QUERY.month)
  @ApiQuery(HEATMAP_QUERY.year)
  @ApiQuery(HEATMAP_QUERY.careerId)
  @ApiParam(HEATMAP_TYPE_PARAM)
  @ApiResponse(HEATMAP_OK_RESPONSE)
  @ApiResponse(HEATMAP_BAD_REQUEST_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  getHeatmap(
    @Param(new ZodValidationPipe(heatmapParamsSchema)) params: HeatmapParams,
    @Query(new ZodValidationPipe(heatmapQuerySchema)) query: HeatmapQuery,
  ) {
    return this.heatmapsService.getHeatmap(params.type, query);
  }

  @Get(':type/export')
  @ApiProduces('application/pdf')
  @ApiOperation({
    operationId: 'exportAnalyticsHeatmap',
    summary: 'Exporta un mapa de calor de habilidades en PDF',
    description: HEATMAP_EXPORT_OPERATION_DESCRIPTION,
  })
  @ApiQuery(HEATMAP_EXPORT_FORMAT_QUERY)
  @ApiQuery(HEATMAP_QUERY.endTimestamp)
  @ApiQuery(HEATMAP_QUERY.startTimestamp)
  @ApiQuery(HEATMAP_QUERY.month)
  @ApiQuery(HEATMAP_QUERY.year)
  @ApiQuery(HEATMAP_QUERY.careerId)
  @ApiParam(HEATMAP_TYPE_PARAM)
  @ApiResponse(HEATMAP_EXPORT_OK_RESPONSE)
  @ApiResponse(HEATMAP_BAD_REQUEST_RESPONSE)
  @ApiResponse(HEATMAP_EXPORT_AUTHOR_NOT_FOUND_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(FORBIDDEN_ROLE_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  async exportHeatmap(
    @Param(new ZodValidationPipe(heatmapParamsSchema)) params: HeatmapParams,
    @Query(new ZodValidationPipe(heatmapQuerySchema)) query: HeatmapQuery,
    @Query(new ZodValidationPipe(heatmapExportQuerySchema))
    _exportQuery: HeatmapExportQuery,
    @CurrentUserId() userId: string,
  ): Promise<StreamableFile> {
    const file = await this.heatmapPdfService.export(params.type, query, userId);
    return new StreamableFile(file.content, {
      type: 'application/pdf',
      disposition: `attachment; filename="${file.fileName}"`,
    });
  }
}
