import { beforeEach, describe, expect, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import { CvFileController } from '../controllers/cv-file.controller.js';
import { CvHistoryController } from '../controllers/cv-history.controller.js';
import { CvModule } from '../cv.module.js';
import { CvMapper } from '../mappers/cv.mapper.js';
import { CvFileRepository } from '../repositories/cv-file.repository.js';
import { CvMetadataRepository } from '../repositories/cv-metadata.repository.js';
import { CvService } from '../services/cv.service.js';
import { CvFileStorage } from '../types/cv-file-storage.type.js';

describe('CvModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CvModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });

  it.each([
    CvHistoryController,
    CvFileController,
    CvService,
    CvMetadataRepository,
    CvFileRepository,
    CvFileStorage,
    CvMapper,
    FileValidationService,
  ])('provides %p', (provider) => {
    expect(moduleRef.get(provider)).toBeDefined();
  });

  it('binds the cv file storage to the repository', () => {
    expect(moduleRef.get(CvFileStorage)).toBe(moduleRef.get(CvFileRepository));
  });
});
