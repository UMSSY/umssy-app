import { beforeEach, describe, expect, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ProfileModule } from '../profile.module.js';
import { CvFileRepository } from '../repositories/cv-file.repository.js';
import { FileValidationService } from '../services/file-validation.service.js';
import { FileStorage } from '../types/file-storage.type.js';

describe('ProfileModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ProfileModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });

  it('resolves the file validation service', () => {
    expect(moduleRef.get(FileValidationService)).toBeInstanceOf(
      FileValidationService,
    );
  });

  it('binds the file storage abstraction to the cv database implementation', () => {
    expect(moduleRef.get(FileStorage)).toBeInstanceOf(CvFileRepository);
  });
});
