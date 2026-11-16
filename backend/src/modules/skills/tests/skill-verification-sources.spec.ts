import { describe, expect, it, vi } from 'vitest';
import { SkillAnalysisService } from '../services/skill-analysis.service.js';
import { SkillEvidenceSourcesService } from '../services/skill-evidence-sources.service.js';
import type { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import type { SkillSourceSnapshot } from '../types/skill-source-snapshot.type.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

const context = {} as TransactionContext;
const row = (id: string, status = 'pending', auto = false) => ({
  id,
  skillId: id,
  source: 'nlp',
  verificationStatus: status,
  radarAutoVerified: auto,
  isHighRelevance: true,
  evidenceRefs: [{ type: 'certification' as const, id: 'cert' }],
  skill: { name: id, areaId: 'qa' },
});
function setup(rows: ReturnType<typeof row>[], snapshot: SkillSourceSnapshot) {
  const repository = {
    findProfileSkillRows: vi.fn().mockResolvedValue(rows),
    applyReconciliation: vi.fn(),
    applyVerificationDecisions: vi.fn().mockResolvedValue(1),
  };
  const sources = { load: vi.fn().mockResolvedValue(snapshot) };
  const service = new SkillAnalysisService(
    repository as unknown as SkillAnalysisRepository,
    sources as unknown as SkillEvidenceSourcesService,
  );
  return { repository, sources, service };
}
const empty = (): SkillSourceSnapshot => ({
  live: new Set(),
  written: new Set(),
  approved: new Map(),
});
describe('skill decisions from owner services', () => {
  it('counts manual pending skills and only live NLP evidence', async () => {
    const rows = [
      row('live'),
      {
        ...row('missing'),
        evidenceRefs: [{ type: 'certification' as const, id: 'removed' }],
      },
      { ...row('manual'), source: 'manual', evidenceRefs: [] },
      row('already', 'approved'),
    ];
    const snapshot = empty();
    snapshot.live.add('certification:cert');
    const { service, sources } = setup(rows, snapshot);
    await expect(service.countPendingPublicationSkills('owner')).resolves.toBe(
      2,
    );
    expect(sources.load).toHaveBeenCalledWith('owner');
  });
  it('approves only the skill explicitly verified for the same source inside the publishing transaction', async () => {
    const rows = [row('verified'), row('unrelated')];
    const snapshot = empty();
    snapshot.approved.set('certification:cert', new Set(['verified']));
    const { service, repository, sources } = setup(rows, snapshot);
    await service.reconcileDetected(
      'owner',
      rows.map((r) => ({
        id: r.skillId,
        name: r.skill.name,
        evidenceRefs: r.evidenceRefs,
      })),
      context,
    );
    expect(sources.load).toHaveBeenCalledWith('owner', context);
    expect(repository.applyVerificationDecisions).toHaveBeenCalledWith(
      'owner',
      [{ id: 'verified', approved: true, expectedStatus:'pending',expectedAuto:false }],
      context,
    );
  });
  it('revokes automatic decisions when their source stops qualifying and preserves manual approvals', async () => {
    const rows = [
      row('automatic', 'approved', true),
      row('administrator', 'approved', false),
    ];
    const { service, repository } = setup(rows, empty());
    await service.reconcileDetected(
      'owner',
      rows.map((r) => ({
        id: r.skillId,
        name: r.skill.name,
        evidenceRefs: r.evidenceRefs,
      })),
      context,
    );
    expect(repository.applyVerificationDecisions).toHaveBeenCalledWith(
      'owner',
      [{ id: 'automatic', approved: false, expectedStatus:'approved',expectedAuto:true }],
      context,
    );
  });
  it('collects foreign evidence only through the owning services and forwards the same transaction', async () => {
    type Args = ConstructorParameters<typeof SkillEvidenceSourcesService>;
    const cvs = {
      findEvidenceRows: vi
        .fn()
        .mockResolvedValue([{ id: 'cv', hasDocument: true }]),
    };
    const certs = {
      findEvidenceRows: vi.fn().mockResolvedValue([
        { id: 'cert', hasDocument: true },
        { id: 'written', hasDocument: false },
      ]),
    };
    const education = {
      findPublicationEvidenceIds: vi
        .fn()
        .mockResolvedValue([{ id: 'education' }]),
    };
    const work = {
      findPublicationEvidenceIds: vi.fn().mockResolvedValue([{ id: 'job' }]),
    };
    const documents = {
      findApprovedDocumentSkills: vi
        .fn()
        .mockResolvedValue([
          {
            sourceType: 'certification',
            sourceId: 'cert',
            skills: [{ id: 'Docker' }],
          },
        ]),
    };
    const service = new SkillEvidenceSourcesService(
      cvs as unknown as Args[0],
      certs as unknown as Args[1],
      education as unknown as Args[2],
      work as unknown as Args[3],
      documents as unknown as Args[4],
    );
    const snapshot = await service.load('owner', context);
    for (const fn of [
      cvs.findEvidenceRows,
      certs.findEvidenceRows,
      education.findPublicationEvidenceIds,
      work.findPublicationEvidenceIds,
      documents.findApprovedDocumentSkills,
    ])
      expect(fn).toHaveBeenCalledWith('owner', context);
    expect(snapshot.live.has('cv:cv')).toBe(true);
    expect(snapshot.written.has('certification:cert')).toBe(false);
    expect(snapshot.written.has('certification:written')).toBe(true);
    expect(snapshot.approved.get('certification:cert')?.has('Docker')).toBe(
      true,
    );
    expect(snapshot.written.has('education:education')).toBe(true);
    expect(snapshot.written.has('work-experience:job')).toBe(true);
  });
});
