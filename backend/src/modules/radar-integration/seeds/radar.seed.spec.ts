import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { seedRadar } from './radar.seed.js';

const users = {
  graduate: { id: 'user-graduate', email: 'graduado@umssy.test' },
  student: { id: 'user-student', email: 'estudiante@umssy.test' },
  eventGraduate: { id: 'user-event', email: 'evento@umssy.test' },
  emptyGraduate: { id: 'user-empty', email: 'sinradar@umssy.test' },
  company: { id: 'user-company', email: 'empresa@umssy.test' },
};

const companies = [
  { id: 'company-tech', title: 'TechBolivia S.R.L.' },
  { id: 'company-nova', title: 'NovaSoft Bolivia' },
  { id: 'company-andes', title: 'Andes Data Labs' },
];

const skills = [
  { id: 'skill-ts', name: 'TypeScript', areaId: 'desarrollo' },
  { id: 'skill-react', name: 'React', areaId: 'desarrollo' },
  { id: 'skill-node', name: 'Node.js', areaId: 'desarrollo' },
  { id: 'skill-js', name: 'JavaScript', areaId: 'desarrollo' },
  { id: 'skill-html', name: 'HTML5', areaId: 'desarrollo' },
  { id: 'skill-css', name: 'CSS3', areaId: 'desarrollo' },
  { id: 'skill-postgres', name: 'PostgreSQL', areaId: 'data-ai' },
  { id: 'skill-python', name: 'Python', areaId: 'data-ai' },
  { id: 'skill-sql', name: 'SQL', areaId: 'data-ai' },
  { id: 'skill-pandas', name: 'Pandas', areaId: 'data-ai' },
  { id: 'skill-powerbi', name: 'Power BI', areaId: 'data-ai' },
  { id: 'skill-docker', name: 'Docker', areaId: 'cloud-devops' },
  { id: 'skill-git', name: 'Git', areaId: 'cloud-devops' },
  { id: 'skill-jest', name: 'Jest', areaId: 'qa' },
  { id: 'skill-scrum', name: 'Scrum', areaId: 'gobernanza-ti' },
];

function setup() {
  const tx = {
    radarArea: { createMany: vi.fn().mockResolvedValue({ count: 6 }) },
    skill: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn(),
    },
    jobApplicationStatus: {
      createMany: vi.fn().mockResolvedValue({ count: 5 }),
      findUnique: vi.fn().mockResolvedValue({ id: 'status-initial' }),
    },
    company: { findMany: vi.fn().mockResolvedValue(companies) },
    jobOffer: { findFirst: vi.fn().mockResolvedValue({ id: 'offer' }) },
    education: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'education' }),
    },
    workExperience: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'experience' }),
    },
    userSkill: { upsert: vi.fn().mockResolvedValue({}) },
    user: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    radarScoreSnapshot: { upsert: vi.fn().mockResolvedValue({}) },
    jobApplication: {
      upsert: vi.fn().mockImplementation(async ({ create }) => ({
        id: `application-${create.userId}`,
      })),
    },
    radarApplicationConsent: { upsert: vi.fn().mockResolvedValue({}) },
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
  tx.skill.findMany.mockImplementation(async ({ where }) => {
    const names: string[] = where?.name?.in ?? [];
    return skills.filter((skill) => names.includes(skill.name));
  });
  return tx;
}

describe('seedRadar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reutiliza catálogos, usuarios y vacantes sin duplicar ni sobrescribir', async () => {
    const tx = setup();

    await seedRadar(tx as unknown as Prisma.TransactionClient, users);

    expect(tx.radarArea.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(tx.skill.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(tx.jobApplicationStatus.createMany).toHaveBeenCalledWith({
      data: [
        { title: 'En revisión' },
        { title: 'Entrevista' },
        { title: 'Aceptada' },
        { title: 'No seleccionado' },
        { title: 'Retirada' },
      ],
      skipDuplicates: true,
    });
    expect(tx.jobOffer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: 'company-tech',
          status: { title: 'Publicada' },
        },
      }),
    );
    expect(tx.jobApplication.upsert).toHaveBeenCalledTimes(4);
    expect(tx.radarApplicationConsent.upsert).toHaveBeenCalledTimes(4);
    expect(tx.userSkill.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
    expect(tx.radarScoreSnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('expone el contacto sólo del primer postulante autorizado', async () => {
    const tx = setup();

    await seedRadar(tx as unknown as Prisma.TransactionClient, users);

    const consents = tx.radarApplicationConsent.upsert.mock.calls.map(
      ([call]) => call.create,
    );
    expect(consents[0]).toMatchObject({
      consentToRecruiter: true,
      consentToCv: false,
      consentToContact: true,
    });
    expect(consents.slice(1).every((item) => !item.consentToContact)).toBe(true);
  });

  it('no recrea educación ni experiencia existentes', async () => {
    const tx = setup();
    tx.education.findFirst.mockResolvedValue({ id: 'education-existing' });
    tx.workExperience.findFirst.mockResolvedValue({
      id: 'experience-existing',
    });

    await seedRadar(tx as unknown as Prisma.TransactionClient, users);

    expect(tx.education.create).not.toHaveBeenCalled();
    expect(tx.workExperience.create).not.toHaveBeenCalled();
  });

  it('falla si no hay una vacante publicada reutilizable', async () => {
    const tx = setup();
    tx.jobOffer.findFirst.mockResolvedValue(null);

    await expect(
      seedRadar(tx as unknown as Prisma.TransactionClient, users),
    ).rejects.toThrow('no hay vacantes');
  });
});
