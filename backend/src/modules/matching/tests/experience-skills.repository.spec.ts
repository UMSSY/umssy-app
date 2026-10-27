import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ExperienceSkillsRepository } from '../repositories/experience-skills.repository.js';
import { buildExperienceRef } from '../utils/build-experience-ref.js';
import { readEvidenceRefs } from '../utils/read-evidence-refs.js';

const USER_ID = '0b9f8a52-3c1d-4e7a-9d55-6f1c2a8b7e10';
const EXPERIENCE_ID = '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10';
const OTHER_REF = 'work_experience:other';
const REF = buildExperienceRef(EXPERIENCE_ID);

describe('buildExperienceRef y readEvidenceRefs', () => {
  it('arma la referencia con el prefijo de experiencia laboral', () => {
    expect(REF).toBe(`work_experience:${EXPERIENCE_ID}`);
  });

  it.each([[null], [undefined], ['texto'], [{ a: 1 }], [5]])(
    'devuelve una lista vacia cuando el valor no es una lista (%o)',
    (value) => {
      expect(readEvidenceRefs(value)).toEqual([]);
    },
  );

  it('conserva solo los textos de la lista', () => {
    expect(readEvidenceRefs(['a', 1, null, 'b'])).toEqual(['a', 'b']);
  });
});

describe('ExperienceSkillsRepository', () => {
  let userSkill: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let workExperience: { findFirst: ReturnType<typeof vi.fn> };
  let repository: ExperienceSkillsRepository;

  beforeEach(() => {
    userSkill = {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    workExperience = { findFirst: vi.fn() };
    const prisma = {
      workExperience,
      userSkill,
      $transaction: vi.fn((callback: (tx: unknown) => Promise<void>) => callback({ userSkill })),
    };
    repository = new ExperienceSkillsRepository(prisma as unknown as PrismaService);
  });

  describe('belongsToUser', () => {
    it('es verdadero cuando la experiencia pertenece a la persona', async () => {
      workExperience.findFirst.mockResolvedValue({ id: EXPERIENCE_ID });

      await expect(repository.belongsToUser(EXPERIENCE_ID, USER_ID)).resolves.toBe(true);
      expect(workExperience.findFirst).toHaveBeenCalledWith({
        where: { id: EXPERIENCE_ID, userId: USER_ID },
        select: { id: true },
      });
    });

    it('es falso cuando la experiencia no existe o es de otra persona', async () => {
      workExperience.findFirst.mockResolvedValue(null);

      await expect(repository.belongsToUser(EXPERIENCE_ID, USER_ID)).resolves.toBe(false);
    });
  });

  describe('replaceDetected', () => {
    it('crea la habilidad detectada con origen nlp y la referencia de la experiencia', async () => {
      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, ['skill-1']);

      expect(userSkill.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, skillId: 'skill-1', source: 'nlp', evidenceRefs: [REF] },
      });
      expect(userSkill.update).not.toHaveBeenCalled();
      expect(userSkill.delete).not.toHaveBeenCalled();
    });

    it('busca los vinculos anteriores de la experiencia por su referencia', async () => {
      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, []);

      expect(userSkill.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, evidenceRefs: { array_contains: [REF] } },
        select: { id: true, skillId: true, source: true, evidenceRefs: true },
      });
    });

    it('agrega la referencia a una habilidad que la persona ya tenia sin cambiar su origen', async () => {
      userSkill.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'row-1', skillId: 'skill-1', evidenceRefs: [] }]);

      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, ['skill-1']);

      expect(userSkill.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: { evidenceRefs: [REF] },
      });
      expect(userSkill.create).not.toHaveBeenCalled();
    });

    it('no repite la referencia cuando la habilidad ya estaba vinculada', async () => {
      userSkill.findMany
        .mockResolvedValueOnce([
          { id: 'row-1', skillId: 'skill-1', source: 'nlp', evidenceRefs: [REF] },
        ])
        .mockResolvedValueOnce([{ id: 'row-1', skillId: 'skill-1', evidenceRefs: [REF] }]);

      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, ['skill-1']);

      expect(userSkill.update).not.toHaveBeenCalled();
      expect(userSkill.create).not.toHaveBeenCalled();
      expect(userSkill.delete).not.toHaveBeenCalled();
    });

    it('elimina la habilidad nlp que dejo de detectarse si no tiene otra referencia', async () => {
      userSkill.findMany.mockResolvedValueOnce([
        { id: 'row-1', skillId: 'skill-1', source: 'nlp', evidenceRefs: [REF] },
      ]);

      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, []);

      expect(userSkill.delete).toHaveBeenCalledWith({ where: { id: 'row-1' } });
    });

    it('conserva la habilidad nlp que otra experiencia sigue respaldando', async () => {
      userSkill.findMany.mockResolvedValueOnce([
        { id: 'row-1', skillId: 'skill-1', source: 'nlp', evidenceRefs: [REF, OTHER_REF] },
      ]);

      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, []);

      expect(userSkill.delete).not.toHaveBeenCalled();
      expect(userSkill.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: { evidenceRefs: [OTHER_REF] },
      });
    });

    it('conserva la habilidad manual aunque deje de detectarse', async () => {
      userSkill.findMany.mockResolvedValueOnce([
        { id: 'row-1', skillId: 'skill-1', source: 'manual', evidenceRefs: [REF] },
      ]);

      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, []);

      expect(userSkill.delete).not.toHaveBeenCalled();
      expect(userSkill.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: { evidenceRefs: [] },
      });
    });

    it('sin habilidades detectadas no consulta las habilidades existentes de la persona', async () => {
      await repository.replaceDetected(USER_ID, EXPERIENCE_ID, []);

      expect(userSkill.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
