import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { NLP_DICTIONARY_VERSION } from '../constants/nlp-dictionary.constants.js';
import { ProfileSkillsRadarMapper } from '../mappers/profile-skills-radar.mapper.js';
import type { ProfileSkillResultsRepository } from '../repositories/profile-skill-results.repository.js';
import type { ProfileSkillSourcesRepository } from '../repositories/profile-skill-sources.repository.js';
import { ProfileSkillsAnalysisService } from '../services/profile-skills-analysis.service.js';
import { SkillDetectionService } from '../services/skill-detection.service.js';
import { SkillValidationService } from '../services/skill-validation.service.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';
import type { NlpDetectedSkill } from '../types/nlp-detected-skill.type.js';
import type { NlpTextSource } from '../types/nlp-text-source.type.js';
import type { ProfileSkillProcessingState } from '../types/profile-skill-processing-state.type.js';
import type { ProfileSkillRow } from '../types/profile-skill-row.type.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';

const userId = '11111111-1111-4111-8111-111111111111';
const catalog: NlpCatalogSkill[] = [
  { id: 'skill-docker', name: 'Docker', areaId: 'cloud-devops' },
  { id: 'skill-python', name: 'Python', areaId: 'data-ai' },
  { id: 'skill-react', name: 'React', areaId: 'desarrollo' },
];
const names = new Map(catalog.map((skill) => [skill.id, skill]));

class InMemoryResults {
  state: ProfileSkillProcessingState | null = null;
  rows: ProfileSkillRow[] = [];
  publishCalls = 0;
  beforePublish?: () => void;

  addManual(skillId: string): void {
    const skill = names.get(skillId)!;
    this.rows.push({
      id: `row-${skillId}`,
      skillId,
      source: 'manual',
      verificationStatus: 'pending',
      isHighRelevance: false,
      evidenceRefs: [],
      skill: { name: skill.name, areaId: skill.areaId },
    });
  }

  findState = async () => this.state;
  findProfileSkillRows = async () => [...this.rows];

  registerSourceChange = async (_userId: string, now: Date) => {
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
  };

  ensureState = async (_userId: string, now: Date) => {
    this.state ??= {
      userId, status: 'pending', inputRevision: 0, processedRevision: null, resultVersion: 0, updatedAt: now, dictionaryVersion: null,
    };
    return this.state;
  };

  markError = async (_userId: string, revision: number, now: Date) => {
    if (this.state && this.state.inputRevision === revision) this.state = { ...this.state, status: 'error', updatedAt: now };
  };

  publish = async (_userId: string, revision: number, detected: readonly NlpDetectedSkill[], dictionaryVersion: string, now: Date) => {
    this.publishCalls += 1;
    this.beforePublish?.();
    if (!this.state || this.state.inputRevision !== revision) return null;
    const plan = planSkillReconciliation(this.rows, detected);
    this.rows = this.rows.filter((row) => !plan.deleteIds.includes(row.id));
    for (const update of plan.updates) {
      this.rows = this.rows.map((row) => (row.id === update.id ? { ...row, evidenceRefs: update.evidenceRefs, isHighRelevance: update.isHighRelevance } : row));
    }
    for (const create of plan.creates) {
      const skill = names.get(create.skillId)!;
      this.rows.push({
        id: `row-${create.skillId}`, skillId: create.skillId, source: 'nlp', verificationStatus: 'pending', isHighRelevance: true,
        evidenceRefs: create.evidenceRefs, skill: { name: skill.name, areaId: skill.areaId },
      });
    }
    const changed = plan.creates.length + plan.updates.length + plan.deleteIds.length > 0;
    const first = this.state.processedRevision === null;
    this.state = {
      ...this.state, status: 'ready', processedRevision: revision, dictionaryVersion, updatedAt: now,
      resultVersion: this.state.resultVersion + (changed || first ? 1 : 0),
    };
    return { state: this.state, changed };
  };
}

describe('ProfileSkillsAnalysisService', () => {
  let results: InMemoryResults;
  let textSources: NlpTextSource[];
  let sources: { userExists: ReturnType<typeof vi.fn>; findTextSources: ReturnType<typeof vi.fn>; findCatalog: ReturnType<typeof vi.fn> };
  let detection: SkillDetectionService;
  let service: ProfileSkillsAnalysisService;
  let logs: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T12:00:00.000Z'));
    results = new InMemoryResults();
    textSources = [{ id: 'w1', type: 'work-experience', text: 'Microservicios con Docker y Python; no usé Kubernetes' }];
    sources = {
      userExists: vi.fn().mockResolvedValue(true),
      findTextSources: vi.fn(async () => textSources),
      findCatalog: vi.fn().mockResolvedValue(catalog),
    };
    detection = new SkillDetectionService();
    service = new ProfileSkillsAnalysisService(
      sources as unknown as ProfileSkillSourcesRepository,
      results as unknown as ProfileSkillResultsRepository,
      detection,
      new SkillValidationService(),
      new ProfileSkillsRadarMapper(),
    );
    logs = [];
    vi.spyOn(Logger.prototype, 'log').mockImplementation((message: unknown) => { logs.push(String(message)); });
    vi.spyOn(Logger.prototype, 'error').mockImplementation((message: unknown) => { logs.push(String(message)); });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('collects manual and detected skills after a change and serves them for the radar', async () => {
    results.addManual('skill-react');

    await service.refreshAfterChange(userId);
    const snapshot = await service.getRadarSnapshot(userId);

    expect(snapshot).toMatchObject({ userId, status: 'ready', version: 1, dictionaryVersion: NLP_DICTIONARY_VERSION });
    expect(snapshot.updatedAt).toBe('2026-10-23T12:00:00.000Z');
    expect(snapshot.skills.map((skill) => [skill.name, skill.source, skill.evidenceRefs.length])).toEqual([
      ['Docker', 'nlp', 1],
      ['Python', 'nlp', 1],
      ['React', 'manual', 0],
    ]);
  });

  it('keeps a skill found in both sources once, as manual, with the text evidence', async () => {
    results.addManual('skill-docker');

    await service.refreshAfterChange(userId);
    const snapshot = await service.getRadarSnapshot(userId);

    expect(snapshot.skills.filter((skill) => skill.id === 'skill-docker')).toEqual([
      expect.objectContaining({ source: 'manual', isHighRelevance: true, evidenceRefs: [{ type: 'work-experience', id: 'w1' }] }),
    ]);
  });

  it('produces an empty ready list for a profile without skills or texts', async () => {
    textSources = [];

    await service.refreshAfterChange(userId);

    expect(await service.getRadarSnapshot(userId)).toMatchObject({ status: 'ready', version: 1, skills: [] });
  });

  it('only keeps the manual skills when the profile has no texts', async () => {
    textSources = [];
    results.addManual('skill-python');

    await service.refreshAfterChange(userId);

    expect((await service.getRadarSnapshot(userId)).skills.map((skill) => skill.source)).toEqual(['manual']);
  });

  it('is idempotent: the same data gives the same list and version, and only the date moves', async () => {
    await service.refreshAfterChange(userId);
    const first = await service.analyzeNow(userId);
    vi.setSystemTime(new Date('2026-10-23T12:05:00.000Z'));
    const second = await service.analyzeNow(userId);

    expect(second.skills).toEqual(first.skills);
    expect(second.version).toBe(first.version);
    expect(results.rows).toHaveLength(2);
    expect(second.updatedAt).toBe('2026-10-23T12:05:00.000Z');
  });

  it('updates the list when a text changes and removes skills without evidence', async () => {
    await service.refreshAfterChange(userId);
    textSources = [{ id: 'w1', type: 'work-experience', text: 'Frontend con React' }];

    await service.refreshAfterChange(userId);
    const snapshot = await service.getRadarSnapshot(userId);

    expect(snapshot.skills.map((skill) => skill.name)).toEqual(['React']);
    expect(snapshot.version).toBe(2);
  });

  it('does not publish a result computed from an older revision', async () => {
    results.beforePublish = () => {
      results.state = { ...results.state!, inputRevision: results.state!.inputRevision + 1, status: 'pending' };
    };

    await service.refreshAfterChange(userId);

    expect(results.rows).toEqual([]);
    expect(results.state?.status).toBe('pending');
    expect(logs.some((line) => line.includes('nlp.analysis.stale'))).toBe(true);
  });

  it('marks the error and keeps the manual skills when the NLP fails', async () => {
    results.addManual('skill-react');
    vi.spyOn(detection, 'detect').mockImplementation(() => {
      throw new Error('Docker y Python en el texto privado');
    });

    await expect(service.refreshAfterChange(userId)).resolves.toBeUndefined();
    const snapshot = await service.getRadarSnapshot(userId);

    expect(snapshot.status).toBe('error');
    expect(snapshot.skills.map((skill) => skill.name)).toEqual(['React']);
    expect(logs.find((line) => line.includes('nlp.analysis.failed'))).toContain('"code":"Error"');
  });

  it('returns the error status to the owner instead of a technical error', async () => {
    sources.findTextSources.mockRejectedValue(Object.assign(new Error('connection lost'), { code: 'P1001' }));

    const response = await service.analyzeNow(userId);

    expect(response.status).toBe('error');
    expect(logs.find((line) => line.includes('nlp.analysis.failed'))).toContain('"code":"P1001"');
  });

  it('never fails the caller when the change cannot be registered', async () => {
    results.registerSourceChange = vi.fn().mockRejectedValue(new Error('database unavailable'));

    await expect(service.refreshAfterChange(userId)).resolves.toBeUndefined();
    expect(logs.some((line) => line.includes('nlp.analysis.trigger_failed'))).toBe(true);
  });

  it('keeps going when the error state cannot be stored either', async () => {
    sources.findCatalog.mockRejectedValue(new Error('down'));
    results.markError = vi.fn().mockRejectedValue(new Error('down'));

    await expect(service.analyzeNow(userId)).resolves.toMatchObject({ status: 'pending' });
  });

  it('reports the discarded keywords to the owner', async () => {
    textSources = [{ id: 'w1', type: 'work-experience', text: 'Docker, Kubernetes y Terraform' }];

    const response = await service.analyzeNow(userId);

    expect(response.analysis.discarded.map((item) => [item.name, item.reason])).toEqual([
      ['Kubernetes', 'not-in-catalog'],
      ['Terraform', 'not-in-catalog'],
    ]);
    expect(response.skills.map((skill) => skill.name)).toEqual(['Docker']);
  });

  it('logs the start, the end and the counts without profile texts or skill names', async () => {
    await service.refreshAfterChange(userId);

    const started = logs.find((line) => line.includes('nlp.analysis.started'));
    const finished = JSON.parse(logs.find((line) => line.includes('nlp.analysis.finished'))!);
    expect(started).toContain(userId);
    expect(finished).toMatchObject({ userId, revision: 1, sources: 1, detected: 2, accepted: 2, discarded: 0, resultVersion: 1 });
    expect(typeof finished.durationMs).toBe('number');
    for (const line of logs) {
      expect(line).not.toMatch(/Docker|Python|Kubernetes|Microservicios/i);
    }
  });

  it('answers 404 when the profile does not exist', async () => {
    sources.userExists.mockResolvedValue(false);

    await expect(service.getRadarSnapshot(userId)).rejects.toBeInstanceOf(ProfileNotFoundException);
    await expect(service.analyzeNow(userId)).rejects.toBeInstanceOf(ProfileNotFoundException);
  });
});
