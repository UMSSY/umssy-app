import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JobConnectController } from './controllers/job-connect.controller.js';
import { VacanciesRepository } from './repositories/vacancies.repository.js';
import { VacanciesService } from './services/vacancies.service.js';
import { SkillDictionaryService } from './services/skill-dictionary.service.js';
import { GapAnalysisService } from './services/gap-analysis.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [JobConnectController],
  providers: [
    VacanciesRepository,
    VacanciesService,
    SkillDictionaryService,
    GapAnalysisService,
  ],
  exports: [VacanciesService, SkillDictionaryService, GapAnalysisService],
})
export class JobConnectModule {}
