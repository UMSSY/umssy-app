import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { SkillAnalysisRepository } from './repositories/skill-analysis.repository.js';
import { SkillAnalysisService } from './services/skill-analysis.service.js';

@Module({
  imports: [PrismaModule],
  providers: [SkillAnalysisRepository, SkillAnalysisService],
  exports: [SkillAnalysisService],
})
export class SkillAnalysisModule {}
