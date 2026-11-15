import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { heatmapParamsSchema } from '../requests/heatmap-params.schema.js';
import { heatmapQuerySchema } from '../requests/heatmap-query.schema.js';
import { HeatmapsService } from '../services/heatmaps.service.js';
import type { HeatmapParams } from '../types/heatmap-params.types.js';
import type { HeatmapQuery } from '../types/heatmap-query.types.js';

@ApiTags('Analíticas')
@Controller('analytics/heatmap')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrativo')
export class HeatmapsController {
  constructor(private readonly heatmapsService: HeatmapsService) {}

  @Get(':type')
  @UseInterceptors(ResponseInterceptor)
  getHeatmap(
    @Param(new ZodValidationPipe(heatmapParamsSchema)) params: HeatmapParams,
    @Query(new ZodValidationPipe(heatmapQuerySchema)) query: HeatmapQuery,
  ) {
    return this.heatmapsService.getHeatmap(params.type, query);
  }
}
