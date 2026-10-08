import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillsService } from '../../skills/services/skills.service.js';
import { DuplicateSkillsException } from '../exceptions/duplicate-skills.exception.js';
import { SkillNotFoundException } from '../exceptions/skill-not-found.exception.js';
import { TooManySkillsException } from '../exceptions/too-many-skills.exception.js';
import {
  MAX_SKILLS_PER_VACANCY,
  SkillsValidationService,
} from '../services/skills-validation.service.js';

describe('SkillsValidationService', () => {
  let service: SkillsValidationService;

  let skillsService: {
    findExistingSkillIds: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    skillsService = {
      findExistingSkillIds: vi.fn(),
    };

    service = new SkillsValidationService(
      skillsService as unknown as SkillsService,
    );
  });

  it('accepts valid skill ids', async () => {
    const skillIds = ['skill-1', 'skill-2'];

    skillsService.findExistingSkillIds.mockResolvedValue([
      'skill-1',
      'skill-2',
    ]);

    await expect(
      service.validateSkillIds(skillIds),
    ).resolves.toBeUndefined();

    expect(skillsService.findExistingSkillIds).toHaveBeenCalledWith(skillIds);
  });

  it('accepts exactly ten skills', async () => {
    const skillIds = Array.from(
      { length: MAX_SKILLS_PER_VACANCY },
      (_, index) => `skill-${index}`,
    );

    skillsService.findExistingSkillIds.mockResolvedValue(skillIds);

    await expect(
      service.validateSkillIds(skillIds),
    ).resolves.toBeUndefined();
  });

  it('rejects more than ten skills', async () => {
    const skillIds = Array.from(
      { length: MAX_SKILLS_PER_VACANCY + 1 },
      (_, index) => `skill-${index}`,
    );

    await expect(
      service.validateSkillIds(skillIds),
    ).rejects.toBeInstanceOf(TooManySkillsException);

    expect(skillsService.findExistingSkillIds).not.toHaveBeenCalled();
  });

  it('rejects duplicated skill ids', async () => {
    const skillIds = ['skill-1', 'skill-1'];

    await expect(
      service.validateSkillIds(skillIds),
    ).rejects.toBeInstanceOf(DuplicateSkillsException);

    expect(skillsService.findExistingSkillIds).not.toHaveBeenCalled();
  });

  it('rejects skill ids that do not exist in the catalog', async () => {
    const skillIds = ['skill-1', 'skill-2'];

    skillsService.findExistingSkillIds.mockResolvedValue([
      'skill-1',
    ]);

    await expect(
      service.validateSkillIds(skillIds),
    ).rejects.toBeInstanceOf(SkillNotFoundException);
  });

  it('accepts an empty skill list', async () => {
    await expect(
      service.validateSkillIds([]),
    ).resolves.toBeUndefined();

    expect(skillsService.findExistingSkillIds).not.toHaveBeenCalled();
  });
});