import { CvFileStorage } from './types/cv-file-storage.type.js';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { CvFileRepository } from './repositories/cv-file.repository.js';
import { CvSourcesService } from './services/cv-sources.service.js';

@Module({
  imports: [PrismaModule],
  providers: [CvFileRepository, CvSourcesService, { provide: CvFileStorage, useExisting: CvFileRepository }],
  exports: [CvSourcesService, CvFileStorage],
})
export class CvSourcesModule {}
