import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { WorkExperienceRepository } from './repositories/work-experience.repository.js';
import { WorkExperienceSourcesService } from './services/work-experience-sources.service.js';

@Module({
  imports: [PrismaModule],
  providers: [WorkExperienceRepository, WorkExperienceSourcesService],
  exports: [WorkExperienceSourcesService],
})
export class WorkExperienceSourcesModule {}
