import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { EducationsRepository } from './repositories/educations.repository.js';
import { EducationSourcesService } from './services/education-sources.service.js';

@Module({
  imports: [PrismaModule],
  providers: [EducationsRepository, EducationSourcesService],
  exports: [EducationSourcesService],
})
export class EducationSourcesModule {}
