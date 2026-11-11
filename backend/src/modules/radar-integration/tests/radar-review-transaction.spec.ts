import type { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { describe, expect, it, vi } from 'vitest';
import { RadarReviewService } from '../services/radar-review.service.js';
import { RadarReviewMapper } from '../mappers/radar-review.mapper.js';
import type { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import type { RadarAccessRepository } from '../repositories/radar-access.repository.js';
import type { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import type { RadarPublicationService } from '../services/radar-publication.service.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

function setup() {
  const client = {} as TransactionContext['client'];
  const repository = {
    changeCvDecision: vi.fn().mockResolvedValue([{ user_id: 'owner' }]),
    cvOwner: vi.fn().mockResolvedValue([{ user_id: 'owner' }]),
    listReviewQueue: vi.fn().mockResolvedValue([]),
  };
  const skills = {
    skillForDecision: vi.fn().mockResolvedValue({ userId: 'owner' }),
    changeSkillDecision: vi.fn().mockResolvedValue({ count: 1 }),
    listReviewQueue: vi.fn().mockResolvedValue([]),
  };
  const access = { recordAudit: vi.fn() };
  const nlp = { refreshAfterChange: vi.fn() };
  const publication = {
    recalculate: vi.fn(),
    myRadar: vi.fn().mockResolvedValue({ userId: 'owner' }),
  };
  const prisma = {
    $transaction: vi.fn(
      (operation: (client: TransactionContext['client']) => Promise<unknown>) =>
        operation(client),
    ),
  };
  const service = new RadarReviewService(
    repository as unknown as RadarReviewRepository,
    access as unknown as RadarAccessRepository,
    nlp as unknown as ProfileSkillsAnalysisService,
    publication as unknown as RadarPublicationService,
    new RadarReviewMapper(),
    skills as unknown as SkillAnalysisService,
    new TransactionService(prisma as unknown as PrismaService),
    {} as CvSourcesService,
  );
  return { service, repository, skills, access, nlp, publication, client };
}

describe('Revisión administrativa transaccional', () => {
  it.each(['cv', 'skill'])(
    'comparte la transacción de %s y su auditoría',
    async (kind) => {
      const { service, repository, skills, access, client } = setup();
      await service.decision('admin', kind, 'evidence', 'approved');
      const write =
        kind === 'cv'
          ? repository.changeCvDecision
          : skills.changeSkillDecision;
      expect(write.mock.calls[0].at(-1)).toEqual({ client });
      expect(access.recordAudit).toHaveBeenCalledWith(
        'owner',
        'admin',
        `${kind}.approved`,
        'evidence',
        {},
        { client },
      );
    },
  );

  it.each(['cv', 'skill'])(
    'aborta %s si falla la auditoría, antes de publicar',
    async (kind) => {
      const { service, access, nlp, publication } = setup();
      access.recordAudit.mockRejectedValue(new Error('audit unavailable'));
      await expect(
        service.decision('admin', kind, 'evidence', 'approved'),
      ).rejects.toThrow('audit unavailable');
      expect(nlp.refreshAfterChange).not.toHaveBeenCalled();
      expect(publication.recalculate).not.toHaveBeenCalled();
    },
  );

  it('un reintento de la misma decisión no duplica la auditoría', async () => {
    const { service, skills, access } = setup();
    skills.changeSkillDecision.mockResolvedValue({ count: 0 });
    await service.decision('admin', 'skill', 'evidence', 'approved');
    expect(access.recordAudit).not.toHaveBeenCalled();
  });

  it('compone la cola mediante el servicio de habilidades', async () => {
    const { service, skills, repository } = setup();
    expect(await service.queue('admin')).toEqual([]);
    expect(repository.listReviewQueue).toHaveBeenCalledOnce();
    expect(skills.listReviewQueue).toHaveBeenCalledOnce();
  });
});
