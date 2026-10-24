import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ProfileSkillsAnalysisController } from '../controllers/profile-skills-analysis.controller.js';
import { ProfileSkillsRadarMapper } from '../mappers/profile-skills-radar.mapper.js';
import { NlpModule } from '../nlp.module.js';
import { ProfileSkillResultsRepository } from '../repositories/profile-skill-results.repository.js';
import { ProfileSkillSourcesRepository } from '../repositories/profile-skill-sources.repository.js';
import { ProfileSkillsAnalysisService } from '../services/profile-skills-analysis.service.js';
import { SkillDetectionService } from '../services/skill-detection.service.js';
import { SkillValidationService } from '../services/skill-validation.service.js';

describe('NlpModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({ imports: [NlpModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });

  it.each([
    ProfileSkillsAnalysisController,
    ProfileSkillsAnalysisService,
    SkillDetectionService,
    SkillValidationService,
    ProfileSkillSourcesRepository,
    ProfileSkillResultsRepository,
    ProfileSkillsRadarMapper,
  ])('provides %p', (provider) => {
    expect(moduleRef.get(provider)).toBeDefined();
  });
});
