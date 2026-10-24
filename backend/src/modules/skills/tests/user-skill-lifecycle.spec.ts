import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileSkillsRadarMapper } from '../../nlp/mappers/profile-skills-radar.mapper.js';
import type { ProfileSkillResultsRepository } from '../../nlp/repositories/profile-skill-results.repository.js';
import type { ProfileSkillSourcesRepository } from '../../nlp/repositories/profile-skill-sources.repository.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { SkillDetectionService } from '../../nlp/services/skill-detection.service.js';
import { SkillValidationService } from '../../nlp/services/skill-validation.service.js';
import type { NlpCatalogSkill } from '../../nlp/types/nlp-catalog-skill.type.js';
import type { NlpDetectedSkill } from '../../nlp/types/nlp-detected-skill.type.js';
import type { NlpTextSource } from '../../nlp/types/nlp-text-source.type.js';
import type { ProfileSkillProcessingState } from '../../nlp/types/profile-skill-processing-state.type.js';
import type { ProfileSkillRow } from '../../nlp/types/profile-skill-row.type.js';
import { planSkillReconciliation } from '../../nlp/utils/plan-skill-reconciliation.js';
import type { ProfileRepository } from '../../profile/repositories/profile.repository.js';
import { DuplicateSkillException } from '../exceptions/duplicate-skill.exception.js';
import { SkillNotFoundException } from '../exceptions/skill-not-found.exception.js';
import { SkillMapper } from '../mappers/skill.mapper.js';
import type { SkillRepository } from '../repositories/skill.repository.js';
import type { UserSkillRepository } from '../repositories/user-skill.repository.js';
import { UserSkillService } from '../services/user-skill.service.js';
import { planManualSkillChanges } from '../utils/plan-manual-skill-changes.js';

const userId = '11111111-1111-4111-8111-111111111111';
const dockerId = '33333333-3333-4333-8333-333333333333';
const pythonId = '44444444-4444-4444-8444-444444444444';
const reactId = '55555555-5555-4555-8555-555555555555';
const unknownId = '66666666-6666-4666-8666-666666666666';

const catalog: NlpCatalogSkill[] = [
  { id: dockerId, name: 'Docker', areaId: 'cloud-devops' },
  { id: pythonId, name: 'Python', areaId: 'data-ai' },
  { id: reactId, name: 'React', areaId: 'desarrollo' },
];
const catalogById = new Map(catalog.map((skill) => [skill.id, skill]));

class InMemoryProfileSkills {
  rows: ProfileSkillRow[] = [];
  state: ProfileSkillProcessingState | null = null;
  beforePublish?: () => Promise<void>;
  private sequence = 0;

  addRow(skillId: string, source: 'manual' | 'nlp', evidenceRefs: unknown[] = []): void {
    const skill = catalogById.get(skillId)!;
    this.sequence += 1;
    this.rows.push({
      id: `row-${this.sequence}`,
      skillId,
      source,
      verificationStatus: 'pending',
      isHighRelevance: evidenceRefs.length > 0,
      evidenceRefs,
      skill: { name: skill.name, areaId: skill.areaId },
    });
  }

  readonly userSkills = {
    findByUserId: async () => this.manualRecords(),
    replaceForUser: async (_userId: string, skillIds: string[]) => {
      const changes = planManualSkillChanges(this.rows, skillIds);
      this.rows = this.rows
        .filter((row) => !changes.deleteIds.includes(row.id))
        .map((row) => {
          if (changes.toDetectedIds.includes(row.id)) return { ...row, source: 'nlp' };
          if (changes.toManualIds.includes(row.id)) return { ...row, source: 'manual' };
          return row;
        });
      for (const skillId of changes.createSkillIds) this.addRow(skillId, 'manual');
      return this.manualRecords();
    },
  };

  readonly results = {
    findState: async () => this.state,
    findProfileSkillRows: async () => [...this.rows],
    registerSourceChange: async (_userId: string, now: Date) => {
      this.state = {
        userId,
        status: 'pending',
        inputRevision: (this.state?.inputRevision ?? 0) + 1,
        processedRevision: this.state?.processedRevision ?? null,
        resultVersion: this.state?.resultVersion ?? 0,
        updatedAt: now,
        dictionaryVersion: this.state?.dictionaryVersion ?? null,
      };
      return this.state;
    },
    ensureState: async () => this.state,
    markError: async (_userId: string, revision: number, now: Date) => {
      if (this.state?.inputRevision === revision) this.state = { ...this.state, status: 'error', updatedAt: now };
    },
    publish: async (
      _userId: string,
      revision: number,
      detected: readonly NlpDetectedSkill[],
      dictionaryVersion: string,
      now: Date,
    ) => {
      const hook = this.beforePublish;
      this.beforePublish = undefined;
      await hook?.();
      if (!this.state || this.state.inputRevision !== revision) return null;

      const plan = planSkillReconciliation(this.rows, detected);
      this.rows = this.rows
        .filter((row) => !plan.deleteIds.includes(row.id))
        .map((row) => {
          const update = plan.updates.find((candidate) => candidate.id === row.id);
          return update ? { ...row, evidenceRefs: update.evidenceRefs, isHighRelevance: update.isHighRelevance } : row;
        });
      for (const create of plan.creates) this.addRow(create.skillId, 'nlp', create.evidenceRefs);

      const changed = plan.creates.length + plan.updates.length + plan.deleteIds.length > 0;
      const isFirstResult = this.state.processedRevision === null;
      this.state = {
        ...this.state,
        status: 'ready',
        processedRevision: revision,
        dictionaryVersion,
        updatedAt: now,
        resultVersion: this.state.resultVersion + (changed || isFirstResult ? 1 : 0),
      };
      return { state: this.state, changed };
    },
  };

  private manualRecords() {
    return this.rows
      .filter((row) => row.source === 'manual')
      .sort((first, second) => first.skill.name.localeCompare(second.skill.name))
      .map((row) => ({ skill: { id: row.skillId, name: row.skill.name, isCustom: false } }));
  }
}

describe('Skill changes sent to the radar', () => {
  let store: InMemoryProfileSkills;
  let textSources: NlpTextSource[];
  let detection: SkillDetectionService;
  let analysis: ProfileSkillsAnalysisService;
  let service: UserSkillService;

  const radarSkills = async () =>
    (await analysis.getRadarSnapshot(userId)).skills.map((skill) => [skill.name, skill.source]);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T12:00:00.000Z'));
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    store = new InMemoryProfileSkills();
    textSources = [{ id: 'w1', type: 'work-experience', text: 'Microservicios con Docker y Python' }];
    detection = new SkillDetectionService();
    const sources = {
      userExists: vi.fn().mockResolvedValue(true),
      findTextSources: vi.fn(async () => textSources),
      findCatalog: vi.fn().mockResolvedValue(catalog),
    };
    analysis = new ProfileSkillsAnalysisService(
      sources as unknown as ProfileSkillSourcesRepository,
      store.results as unknown as ProfileSkillResultsRepository,
      detection,
      new SkillValidationService(),
      new ProfileSkillsRadarMapper(),
    );
    const skillRepository = {
      findByIds: async (ids: string[]) =>
        ids.flatMap((id) => {
          const skill = catalogById.get(id);
          return skill ? [{ id: skill.id, name: skill.name, isCustom: false }] : [];
        }),
    };
    const profileRepository = { findByUserId: vi.fn().mockResolvedValue({ id: userId }) };
    service = new UserSkillService(
      store.userSkills as unknown as UserSkillRepository,
      skillRepository as unknown as SkillRepository,
      profileRepository as unknown as ProfileRepository,
      new SkillMapper(),
      analysis,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sends an added skill to the radar together with the detected ones', async () => {
    const saved = await service.updateUserSkills(userId, { skillIds: [reactId] });

    expect(saved.map((skill) => skill.name)).toEqual(['React']);
    expect(await analysis.getRadarSnapshot(userId)).toMatchObject({ status: 'ready', version: 1 });
    expect(await radarSkills()).toEqual([
      ['Docker', 'nlp'],
      ['Python', 'nlp'],
      ['React', 'manual'],
    ]);
  });

  it('sends the edited list when a skill is replaced by another one', async () => {
    await service.updateUserSkills(userId, { skillIds: [reactId] });
    vi.setSystemTime(new Date('2026-10-24T12:05:00.000Z'));

    const saved = await service.updateUserSkills(userId, { skillIds: [dockerId] });
    const snapshot = await analysis.getRadarSnapshot(userId);

    expect(saved.map((skill) => skill.name)).toEqual(['Docker']);
    expect(snapshot).toMatchObject({ status: 'ready', updatedAt: '2026-10-24T12:05:00.000Z' });
    // The radar contract detects changes through updatedAt; version only moves when the NLP output changes.
    expect(snapshot.version).toBe(1);
    expect(await radarSkills()).toEqual([
      ['Docker', 'manual'],
      ['Python', 'nlp'],
    ]);
    expect(snapshot.skills.find((skill) => skill.id === dockerId)?.evidenceRefs).toEqual([
      { type: 'work-experience', id: 'w1' },
    ]);
  });

  it('removes a deleted skill from the radar when no text supports it', async () => {
    await service.updateUserSkills(userId, { skillIds: [reactId, pythonId] });

    await service.updateUserSkills(userId, { skillIds: [pythonId] });

    expect(await radarSkills()).toEqual([
      ['Docker', 'nlp'],
      ['Python', 'manual'],
    ]);
  });

  it('keeps a deleted skill as detected when the texts still support it', async () => {
    await service.updateUserSkills(userId, { skillIds: [dockerId] });

    const saved = await service.updateUserSkills(userId, { skillIds: [] });

    expect(saved).toEqual([]);
    expect(await radarSkills()).toEqual([
      ['Docker', 'nlp'],
      ['Python', 'nlp'],
    ]);
  });

  it('does not analyse nor change the radar when the change is rejected', async () => {
    await service.updateUserSkills(userId, { skillIds: [reactId] });
    const before = await analysis.getRadarSnapshot(userId);

    await expect(service.updateUserSkills(userId, { skillIds: [reactId, reactId] })).rejects.toBeInstanceOf(
      DuplicateSkillException,
    );
    await expect(service.updateUserSkills(userId, { skillIds: [unknownId] })).rejects.toBeInstanceOf(
      SkillNotFoundException,
    );

    expect(await analysis.getRadarSnapshot(userId)).toEqual(before);
    expect(store.state?.inputRevision).toBe(1);
  });

  it('never replaces a newer list with the result of an older change', async () => {
    store.beforePublish = async () => {
      await service.updateUserSkills(userId, { skillIds: [pythonId] });
    };

    await service.updateUserSkills(userId, { skillIds: [reactId] });

    expect(store.state).toMatchObject({ status: 'ready', inputRevision: 2, processedRevision: 2 });
    expect(await radarSkills()).toEqual([
      ['Docker', 'nlp'],
      ['Python', 'manual'],
    ]);
  });

  it('keeps the saved skills and sends only the manual ones when the analysis fails', async () => {
    await service.updateUserSkills(userId, { skillIds: [reactId] });
    vi.spyOn(detection, 'detect').mockImplementation(() => {
      throw new Error('Detection failed');
    });

    const saved = await service.updateUserSkills(userId, { skillIds: [reactId, pythonId] });

    expect(saved.map((skill) => skill.name)).toEqual(['Python', 'React']);
    expect((await analysis.getRadarSnapshot(userId)).status).toBe('error');
    expect(await radarSkills()).toEqual([
      ['Python', 'manual'],
      ['React', 'manual'],
    ]);
  });
});
