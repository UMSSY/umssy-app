import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  FORBIDDEN_ROLE_RESPONSE,
  INTERNAL_ERROR_RESPONSE,
  UNAUTHENTICATED_RESPONSE,
} from '../../../common/constants/api-error-swagger.constants.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import {
  HEATMAP_BAD_REQUEST_RESPONSE,
  HEATMAP_OK_RESPONSE,
  HEATMAP_OPERATION_DESCRIPTION,
  HEATMAP_QUERY,
  HEATMAP_TYPE_PARAM,
} from '../constants/heatmap-swagger.constants.js';
import { heatmapParamsSchema } from '../requests/heatmap-params.schema.js';
import { heatmapQuerySchema } from '../requests/heatmap-query.schema.js';
import { HeatmapsService } from '../services/heatmaps.service.js';
import type { HeatmapParams } from '../types/heatmap-params.types.js';
import type { HeatmapQuery } from '../types/heatmap-query.types.js';

@ApiTags('Analíticas')
@ApiBearerAuth()
@Controller('analytics/heatmap')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrativo')
export class HeatmapsController {
  constructor(private readonly heatmapsService: HeatmapsService) {}

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
}
