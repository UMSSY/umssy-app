import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import { ProfileSkillsEvents } from '../../common/profile-skills/profile-skills-events.service.js';
import type { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { RadarIntegrationService } from './radar-integration.service.js';
import { emptyScores, scoreVerifiedSkills } from './radar-scoring.js';

const userId = '11111111-1111-4111-8111-111111111111';
const skill = (id: string, source = 'nlp', evidenceRefs: unknown = [{ type: 'work-experience', id: 'own-experience' }], areaId: string | null = 'qa') => ({
  skillId: id, source, evidenceRefs, isHighRelevance: source === 'nlp', skill: { name: id, areaId },
});
const snapshot = (revision: number | null = 2) => ({
  user_id: userId, version: 4, source_revision: revision, rubric_version: 'epic3-provisional-1',
  fingerprint: 'previous', scores: { ...emptyScores(), qa: 1.5 }, evidence: { qa: [{ id: 'verified', name: 'verified' }] },
  skills: [{ id: 'verified', name: 'verified', areaId: 'qa', isHighRelevance: true, evidenceRefs: [{ type: 'work-experience', id: 'own-experience' }] }],
  average_score: '0.25', created_at: new Date('2026-10-26T12:00:00Z'),
});

function setup() {
  const state = { status: 'ready', inputRevision: 2, processedRevision: 2, dictionaryVersion: '1' };
  const rows = [snapshot()];
  const db = {
    $queryRaw: vi.fn(), $executeRaw: vi.fn().mockResolvedValue(1),
    userSkill: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    workExperience: { findMany: vi.fn().mockResolvedValue([{ id: 'own-experience' }]) },
    education: { findMany: vi.fn().mockResolvedValue([{ id: 'own-education' }]) },
    certification: { findMany: vi.fn().mockResolvedValue([{ id: 'own-certification' }]) },
    profileSkillProcessingState: { findUnique: vi.fn().mockResolvedValue(state) },
    $transaction: vi.fn(),
  };
  const insertions: unknown[][] = [];
  db.$queryRaw.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.join('');
    if (sql.includes('pg_advisory')) return [{ locked: 1 }];
    if (sql.includes('FROM profile_skill_processing_states')) return [{ input_revision: state.inputRevision, processed_revision: state.processedRevision, status: state.status }];
    if (sql.includes('COUNT(*)')) return [{ count: 0n }];
    if (sql.includes('FROM radar_cv_evidence')) return [
      { cv_id: 'approved-cv', review_status: 'approved', extraction_status: 'ready' },
      { cv_id: 'pending-cv', review_status: 'pending', extraction_status: 'ready' },
    ];
    if (sql.includes('FROM radar_score_snapshots')) return rows;
    if (sql.includes('INSERT INTO radar_score_snapshots')) { insertions.push(values); return [snapshot()]; }
    if (sql.includes('FROM radar_audit_events')) return [];
    throw new Error('Unexpected database operation');
  });
  db.$transaction.mockImplementation(async operation => operation(db));
  const nlp = { analyzeNow: vi.fn().mockResolvedValue({ status: 'ready' }) };
  const events = new ProfileSkillsEvents();
  const service = new RadarIntegrationService(db as unknown as PrismaService, nlp as unknown as ProfileSkillsAnalysisService, events);
  return { service, db, state, rows, insertions, nlp, events };
}

describe('Radar publication consistency', () => {
  it('publishes only current owned evidence, excluding pending CVs and orphaned approvals', async () => {
    const { service, db, insertions } = setup();
    db.userSkill.findMany.mockResolvedValue([
      skill('manual', 'manual', []), skill('experience', 'nlp', [{ type: 'work-experience', id: 'own-experience' }, { type: 'education', id: 'own-education' }]),
      skill('education', 'nlp', [{ type: 'education', id: 'own-education' }]),
      skill('certification', 'nlp', [{ type: 'certification', id: 'own-certification' }]),
      skill('approved-cv', 'nlp', [{ type: 'cv', id: 'approved-cv' }]),
      skill('pending-cv', 'nlp', [{ type: 'cv', id: 'pending-cv' }]),
      skill('foreign', 'nlp', [{ type: 'work-experience', id: 'foreign-experience' }]),
      skill('invalid-manual-reference', 'manual', [{ type: 'work-experience', id: 'foreign-experience' }]),
      skill('orphan', 'nlp', []), skill('unclassified', 'manual', [], null),
      skill('malformed', 'nlp', [null, 42, { type: 'cv' }, { type: 2, id: 'approved-cv' }, { type: 'cv', id: 2 }, { type: 'unknown', id: 'unknown' }]),
      skill('missing-refs', 'nlp', null),
    ]);
    await service.recalculate(userId, null);
    expect(insertions).toHaveLength(1);
    const accepted = JSON.parse(db.$executeRaw.mock.calls[0][3] as string).skills as { id: string }[];
    expect(accepted.map(row => row.id)).toEqual(['manual', 'experience', 'education', 'certification', 'approved-cv', 'invalid-manual-reference']);
  });

  it('does not publish a result received for an obsolete source revision', async () => {
    const { service, insertions, db } = setup();
    await expect(service.recalculate(userId, null, { userId, inputRevision: 1, resultVersion: 1 })).resolves.toBeNull();
    expect(insertions).toEqual([]);
    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it('keeps the publication version when a newer revision has identical evidence', async () => {
    const { service, rows, db, insertions } = setup();
    const accepted = [{ id: 'verified', name: 'verified', areaId: 'qa', isHighRelevance: true, evidenceRefs: [{ type: 'work-experience', id: 'own-experience' }] }];
    rows[0].fingerprint = scoreVerifiedSkills(accepted).fingerprint;
    db.userSkill.findMany.mockResolvedValue([skill('verified')]);
    const result = await service.recalculate(userId, null);
    expect(result?.version).toBe(4);
    expect(result?.sourceRevision).toBe(2);
    expect(insertions).toEqual([]);
  });

  it('refuses to score a pending NLP revision and persists a recoverable failure', async () => {
    const { service, state, rows, db, insertions } = setup();
    state.status = 'pending';
    const previous = structuredClone(rows);
    await expect(service.recalculate(userId, null)).rejects.toThrow('El análisis del perfil aún no está actualizado.');
    expect(rows).toEqual(previous);
    expect(insertions).toEqual([]);
    expect(db.$executeRaw).toHaveBeenCalled();
  });

  it('does not hide the original publication failure if saving its error state also fails', async () => {
    const { service, db } = setup();
    db.$transaction.mockRejectedValueOnce(new Error('snapshot failed'));
    db.$executeRaw.mockRejectedValueOnce(new Error('error persistence failed'));
    await expect(service.recalculate(userId, null)).rejects.toThrow('snapshot failed');
  });

  it('subscribes on initialization, awaits processing and unsubscribes on destruction', async () => {
    const { service, events } = setup();
    const recalculate = vi.spyOn(service, 'recalculate').mockResolvedValue(null);
    service.onModuleInit();
    const publication = { userId, inputRevision: 2, resultVersion: 1 };
    await events.published(publication);
    expect(recalculate).toHaveBeenCalledWith(userId, null, publication);
    service.onModuleDestroy();
    await events.published(publication);
    expect(recalculate).toHaveBeenCalledOnce();
  });

  it('retries NLP before publishing and rejects a failed analysis', async () => {
    const { service, nlp } = setup();
    const recalculate = vi.spyOn(service, 'recalculate').mockResolvedValue(null);
    vi.spyOn(service, 'myRadar').mockResolvedValue({ marker: 'current' } as never);
    await expect(service.retry(userId)).resolves.toEqual({ marker: 'current' });
    expect(nlp.analyzeNow).toHaveBeenCalledWith(userId);
    expect(recalculate).toHaveBeenCalledWith(userId, userId);
    nlp.analyzeNow.mockResolvedValueOnce({ status: 'error' });
    await expect(service.retry(userId)).rejects.toThrow('El análisis sigue pendiente o falló');
    expect(recalculate).toHaveBeenCalledOnce();
  });
});

describe('Published radar processing states', () => {
  it.each([[2, 'error'], [1, 'ready']])('reports a failed attempt only for its own source revision %s', async (revision, status) => {
    const { service, db, rows } = setup();
    db.userSkill.count.mockResolvedValue(3);
    db.$queryRaw.mockResolvedValueOnce(rows).mockResolvedValueOnce([{ count: 1n }]).mockResolvedValueOnce([{ source_revision: revision, status: 'error' }]);
    const result = await service.myRadar(userId);
    expect(result.processingStatus).toBe(status);
    expect(result.pending).toBe(4);
    expect(result.hasPending).toBe(true);
  });

  it('compares only persisted publication averages', async () => {
    const { service, rows } = setup();
    rows.push({ ...snapshot(1), version: 3, average_score: '0.10' });
    expect((await service.myRadar(userId)).variation).toBe(0.15);
  });

  it.each([
    ['current', 'ready', 2, 2, 'ready'],
    ['new source', 'pending', 3, 2, 'pending'],
    ['failed NLP', 'error', 3, 2, 'error'],
    ['unprocessed source', 'ready', 3, 2, 'pending'],
  ])('reports %s without replacing the last valid publication', async (_label, status, inputRevision, processedRevision, expected) => {
    const { service, state } = setup();
    Object.assign(state, { status, inputRevision, processedRevision });
    const result = await service.myRadar(userId);
    expect(result.processingStatus).toBe(expected);
    expect(result.version).toBe(4);
    expect(result.scores.qa).toBe(1.5);
  });

  it('reports a legacy publication as pending until its revision is initialized', async () => {
    const { service, rows } = setup();
    rows[0] = snapshot(null);
    expect((await service.myRadar(userId)).processingStatus).toBe('pending');
  });

  it('returns all zero axes for a new owner without stored state', async () => {
    const { service, db, rows } = setup();
    rows.length = 0;
    db.profileSkillProcessingState.findUnique.mockResolvedValueOnce(null as never);
    const result = await service.myRadar(userId);
    expect(result).toMatchObject({ status: 'empty', processingStatus: 'ready', version: 0, pending: 0 });
    expect(result.scores).toEqual(emptyScores());
    expect(result.skills).toEqual([]);
  });
});
