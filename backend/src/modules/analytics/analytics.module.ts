import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { HeatmapsController } from './controllers/heatmaps.controller.js';
import { HeatmapGraduatesRepository } from './repositories/heatmap-graduates.repository.js';
import { HeatmapsService } from './services/heatmaps.service.js';

@Module({
  imports: [JwtAuthModule],
  controllers: [HeatmapsController],
  providers: [HeatmapsService, HeatmapGraduatesRepository],
})
export class AnalyticsModule {}
