import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { AccessRequestsModule } from '../access-requests/access-requests.module.js';
import { SkillAnalysisModule } from '../skills/skill-analysis.module.js';
import { SurveysModule } from '../surveys/surveys.module.js';
import { WorkExperienceSourcesModule } from '../work-experience/work-experience-sources.module.js';
import { HeatmapsController } from './controllers/heatmaps.controller.js';
import { HeatmapGraduatesService } from './services/heatmap-graduates.service.js';
import { HeatmapsService } from './services/heatmaps.service.js';

@Module({
  imports: [
    JwtAuthModule,
    SurveysModule,
    AccessRequestsModule,
    SkillAnalysisModule,
    WorkExperienceSourcesModule,
  ],
  controllers: [HeatmapsController],
  providers: [HeatmapsService, HeatmapGraduatesService],
})
export class AnalyticsModule {}
