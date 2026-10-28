import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SEED_TECHNICAL_AREAS } from '../../technical-areas/constants/seed-technical-areas.constants.js';
import { SKILL_TO_TECHNICAL_AREA } from '../constants/skill-to-technical-area.catalog.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorAffinityService } from '../services/mentor-affinity.service.js';
import { MentorsService } from '../services/mentors.service.js';

const areaIds = new Map<string, string>(
  SEED_TECHNICAL_AREAS.map(({ name }, index) => [name, `area-${index}`]),
);
const filters = {
  search: '',
  available: false,
  sort: 'affinity' as const,
  page: 1,
};

function mentor(
  id: string,
  firstName: string,
  lastName: string,
  areas: string[],
) {
  return {
    id,
    firstName,
    lastName,
    mentorTechnicalAreas: areas.map((name) => ({
      technicalAreaId: areaIds.get(name)!,
    })),
  };
}

function makeContext(
  skills: Array<{ name: string; isCustom?: boolean }>,
  candidates: ReturnType<typeof mentor>[],
) {
  const skillFindMany = vi
    .fn()
    .mockResolvedValue(
      skills.map(({ name, isCustom = false }) => ({
        skill: { name, isCustom },
      })),
    );
  const areaFindMany = vi
    .fn()
    .mockImplementation(async ({ where }) =>
      where.name.in
        .map((name: string) => ({ id: areaIds.get(name), name }))
        .filter(({ id }: { id?: string }) => id),
    );
  const userFindMany = vi.fn().mockImplementation(async ({ select, where }) => {
    if (select.firstName && !select.educations) return candidates;
    if (select.educations) {
      return candidates
        .filter(({ id }) => where.id.in.includes(id))
        .map((candidate) => ({
          ...candidate,
          headline: null,
          isAvailableForMentoring: false,
          educations: [],
          mentorOrientationTypes: [],
          mentorTechnicalAreas: candidate.mentorTechnicalAreas.map(
            ({ technicalAreaId }) => ({
              technicalArea: {
                name: [...areaIds].find(([, id]) => id === technicalAreaId)![0],
              },
            }),
          ),
        }));
    }
    return [];
  });
  const userCount = vi.fn();
  const repository = new MentorsRepository({
    userSkill: { findMany: skillFindMany },
    technicalArea: { findMany: areaFindMany },
    user: { findMany: userFindMany, count: userCount },
  } as unknown as PrismaService);
  const affinityService = new MentorAffinityService(repository);
  const service = new MentorsService(
    repository,
    new MentorMapper(),
    affinityService,
  );
  return {
    service,
    affinityService,
    skillFindMany,
    areaFindMany,
    userFindMany,
    userCount,
  };
}

describe('MentorAffinityService', () => {
  it('contiene exactamente las correspondencias aprobadas y áreas oficiales', () => {
    expect(SKILL_TO_TECHNICAL_AREA).toEqual({
      'Node.js': 'Backend',
      NestJS: 'Backend',
      'Spring Boot': 'Backend',
      Django: 'Backend',
      FastAPI: 'Backend',
      React: 'Desarrollo Web',
      'Vue.js': 'Desarrollo Web',
      Angular: 'Desarrollo Web',
      'Next.js': 'Desarrollo Web',
      HTML5: 'Desarrollo Web',
      CSS3: 'Desarrollo Web',
      'Tailwind CSS': 'Desarrollo Web',
      SQL: 'Bases de Datos',
      PostgreSQL: 'Bases de Datos',
      MongoDB: 'Bases de Datos',
      Redis: 'Bases de Datos',
      Docker: 'Cloud',
      Kubernetes: 'Cloud',
    });
    expect(
      Object.values(SKILL_TO_TECHNICAL_AREA).every((name) => areaIds.has(name)),
    ).toBe(true);
  });

  it('distingue perfil vacío, desconocido y habilidad personalizada', async () => {
    const empty = makeContext([], []);
    expect(await empty.affinityService.findUserAreaIds('user-1')).toMatchObject(
      { status: 'no_skills' },
    );
    expect(empty.areaFindMany).not.toHaveBeenCalled();

    const unknown = makeContext(
      [{ name: 'Python' }, { name: 'NestJS', isCustom: true }],
      [],
    );
    expect(
      await unknown.affinityService.findUserAreaIds('user-1'),
    ).toMatchObject({ status: 'unmapped_skills' });
    expect(unknown.areaFindMany).not.toHaveBeenCalled();
  });

  it('cuenta áreas únicas en el ejemplo 2–1–0 y conserva mentores sin áreas', async () => {
    const context = makeContext(
      [{ name: 'NestJS' }, { name: 'Docker' }],
      [
        mentor('a', 'Ana', 'Uno', ['Backend', 'Cloud', 'Arquitectura']),
        mentor('b', 'Beto', 'Dos', ['Backend']),
        mentor('c', 'Celia', 'Tres', []),
      ],
    );
    const result = await context.service.findDirectory(filters, 'session-user');

    expect(
      result.items.map(({ id, sharedInterestsCount }) => [
        id,
        sharedInterestsCount,
      ]),
    ).toEqual([
      ['a', 2],
      ['b', 1],
      ['c', 0],
    ]);
    expect(result).toMatchObject({
      effectiveSort: 'affinity',
      affinityStatus: 'ready',
      totalItems: 3,
    });
    expect(context.skillFindMany).toHaveBeenCalledOnce();
    expect(context.skillFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'session-user' } }),
    );
  });

  it('deduplica varias habilidades de una misma área y áreas repetidas del mentor', async () => {
    const context = makeContext(
      [{ name: 'NestJS' }, { name: 'Spring Boot' }, { name: 'Docker' }],
      [mentor('a', 'Ana', 'Uno', ['Backend', 'Backend', 'Cloud'])],
    );
    const result = await context.service.findDirectory(filters, 'user-1');
    expect(result.items[0].sharedInterestsCount).toBe(2);
    expect(context.areaFindMany.mock.calls[0][0].where.name.in).toEqual([
      'Backend',
      'Cloud',
    ]);
  });

  it.each([
    { skills: [], status: 'no_skills' },
    { skills: [{ name: 'Python' }], status: 'unmapped_skills' },
  ])('mantiene A–Z sin contador para $status', async ({ skills, status }) => {
    const context = makeContext(skills, []);
    context.userCount.mockResolvedValue(0);
    const result = await context.service.findDirectory(filters, 'user-1');
    expect(result).toMatchObject({
      effectiveSort: 'name_asc',
      affinityStatus: status,
      items: [],
    });
    expect(context.userFindMany).not.toHaveBeenCalled();
  });

  it('mantiene ready y ceros reales cuando nadie coincide, con desempate por nombre e ID', async () => {
    const context = makeContext(
      [{ name: 'NestJS' }],
      [
        mentor('z', 'Ana', 'Rojas', ['Cloud']),
        mentor('a', 'Ana', 'Rojas', ['Datos']),
        mentor('b', 'Ana', 'Paz', []),
        mentor('c', 'Beto', 'Paz', []),
      ],
    );
    const result = await context.service.findDirectory(filters, 'user-1');
    expect(result.items.map(({ id }) => id)).toEqual(['b', 'a', 'z', 'c']);
    expect(
      result.items.every(
        ({ sharedInterestsCount }) => sharedInterestsCount === 0,
      ),
    ).toBe(true);
    expect(result.affinityStatus).toBe('ready');
  });

  it.each([18, 20, 25])(
    'ordena globalmente %i candidatos antes de paginar sin duplicados',
    async (total) => {
      const candidates = Array.from({ length: total }, (_, index) =>
        mentor(
          `mentor-${String(index).padStart(2, '0')}`,
          `Nombre${String(index).padStart(2, '0')}`,
          'Apellido',
          index === total - 1 ? ['Backend'] : [],
        ),
      );
      const context = makeContext([{ name: 'NestJS' }], candidates);
      const ids: string[] = [];
      for (let page = 1; page <= Math.ceil(total / 6); page++) {
        const result = await context.service.findDirectory(
          { ...filters, page },
          'user-1',
        );
        expect(result.items).toHaveLength(Math.min(6, total - (page - 1) * 6));
        expect(result.totalItems).toBe(total);
        ids.push(...result.items.map(({ id }) => id));
      }
      expect(ids[0]).toBe(`mentor-${String(total - 1).padStart(2, '0')}`);
      expect(new Set(ids).size).toBe(total);
      const last = await context.service.findDirectory(
        { ...filters, page: 99 },
        'user-1',
      );
      expect(last.page).toBe(Math.ceil(total / 6));
      expect(
        context.userFindMany.mock.calls
          .filter(([arg]) => arg.select.educations)
          .every(([arg]) => arg.where.id.in.length <= 6),
      ).toBe(true);
    },
  );

  it('mantiene estado ready con directorio vacío y página normalizada', async () => {
    const context = makeContext([{ name: 'NestJS' }], []);
    const result = await context.service.findDirectory(
      { ...filters, page: 9 },
      'user-1',
    );
    expect(result).toMatchObject({
      items: [],
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 0,
      affinityStatus: 'ready',
      effectiveSort: 'affinity',
    });
    expect(context.userFindMany).toHaveBeenCalledOnce();
  });

  it('aplica conjuntamente filtros al ranking y limita detalles y fotos a seis IDs', async () => {
    const context = makeContext(
      [{ name: 'NestJS' }],
      [mentor('a', 'Ana', 'Rojas', ['Backend'])],
    );
    const result = await context.service.findDirectory(
      { ...filters, search: 'Ana Rojas', area: 'Backend', available: true },
      'user-1',
    );
    expect(result.items).toHaveLength(1);
    const candidateQuery = context.userFindMany.mock.calls[0][0];
    const detailsQuery = context.userFindMany.mock.calls[1][0];
    expect(candidateQuery.where).toMatchObject({
      isActive: true,
      isAvailableForMentoring: true,
      mentorTechnicalAreas: { some: { technicalArea: { name: 'Backend' } } },
    });
    expect(candidateQuery.where.AND).toHaveLength(2);
    expect(detailsQuery.where).toMatchObject({
      ...candidateQuery.where,
      id: { in: ['a'] },
    });
    expect(candidateQuery.select).not.toHaveProperty('educations');
    expect(candidateQuery.select).not.toHaveProperty('photoUrl');
    expect(detailsQuery.select).not.toHaveProperty('photoUrl');
    expect(context.userFindMany).toHaveBeenCalledTimes(3);
  });
});
