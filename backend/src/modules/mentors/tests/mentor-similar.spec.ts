import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ParseUUIDPipe, RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  PATH_METADATA,
  METHOD_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { MentorsController } from '../controllers/mentors.controller.js';
import { MentorNotFoundException } from '../exceptions/mentor-not-found.exception.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorsService } from '../services/mentors.service.js';

type Candidate = NonNullable<
  Awaited<ReturnType<MentorsRepository['findSimilaritySource']>>
>;
function candidate(
  id: string,
  areas: string[] = [],
  orientations: string[] = [],
): Candidate {
  return {
    id,
    mentorTechnicalAreas: areas.map((technicalAreaId) => ({ technicalAreaId })),
    mentorOrientationTypes: orientations.map((orientationTypeId) => ({
      orientationTypeId,
    })),
  };
}

describe('Mentores similares', () => {
  const sourceId = '11111111-1111-4111-8111-111111111111';
  const findFirst = vi.fn();
  const findMany = vi.fn();
  let repository: MentorsRepository;
  let service: MentorsService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: { user: { findFirst, findMany } } },
        MentorsRepository,
      ],
    }).compile();
    repository = module.get(MentorsRepository);
    const services = await Test.createTestingModule({
      providers: [
        {
          provide: MentorsService,
          useFactory: (skills: UserSkillService) =>
            new MentorsService(repository, new MentorMapper(), skills),
          inject: [UserSkillService],
        },
        { provide: UserSkillService, useValue: {} },
      ],
    }).compile();
    service = services.get(MentorsService);
    findFirst.mockResolvedValue(candidate(sourceId, ['a', 'b'], ['o', 'p']));
  });

  function results(candidates: Candidate[]) {
    findMany
      .mockResolvedValueOnce(candidates)
      .mockResolvedValueOnce(
        [...candidates].reverse().map(({ id }) => ({
          id,
          firstName: 'Ana',
          lastName: 'Rojas',
          headline: null,
          isAvailableForMentoring: false,
          educations: [],
          mentorTechnicalAreas: [{ technicalArea: { name: 'Backend' } }],
          mentorOrientationTypes: [{ orientationType: { name: 'Empleo' } }],
          email: 'private@example.test',
        })),
      )
      .mockResolvedValueOnce([]);
  }

  it.each([
    ['área técnica', ['a'], []],
    ['solo orientación', [], ['o']],
    ['ambas categorías sin duplicarse', ['a'], ['o']],
  ])('incluye coincidencias por %s', async (_label, areas, orientations) => {
    results([candidate('mentor', areas, orientations)]);
    expect(await service.findSimilar(sourceId)).toHaveLength(1);
  });

  it('preserva disponibilidad falsa, null y el contrato público explícito', async () => {
    results([candidate('mentor', ['a'])]);
    expect(await service.findSimilar(sourceId)).toEqual([
      {
        id: 'mentor',
        fullName: 'Ana Rojas',
        headline: null,
        photoUrl: null,
        education: null,
        isAvailable: false,
        technicalAreas: ['Backend'],
        orientationTypes: ['Empleo'],
      },
    ]);
  });

  it('elige tres por áreas, luego orientaciones y finalmente ID, antes de hidratar', async () => {
    results([
      candidate('orientation-only', [], ['o', 'p']),
      candidate('z', ['a'], ['o']),
      candidate('b', ['a'], ['o']),
      candidate('a', ['a'], ['o']),
      candidate('best-orientation', ['a'], ['o', 'p']),
      candidate('best-area', ['a', 'b']),
    ]);
    expect((await service.findSimilar(sourceId)).map(({ id }) => id)).toEqual([
      'best-area',
      'best-orientation',
      'a',
    ]);
    expect(findMany.mock.calls[1][0].where.id).toEqual({
      in: ['best-area', 'best-orientation', 'a'],
    });
  });

  it('devuelve vacío sin coincidencias y no hidrata tarjetas', async () => {
    findMany.mockResolvedValueOnce([]);
    expect(await service.findSimilar(sourceId)).toEqual([]);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('omite al candidato que deja de estar activo antes de cargar su tarjeta', async () => {
    const remaining: Awaited<
      ReturnType<MentorsRepository['findDirectoryByIds']>
    >[number] = {
      id: 'remaining',
      firstName: 'Ana',
      lastName: 'Rojas',
      headline: null,
      photoVersion: null,
      isAvailableForMentoring: false,
      educations: [],
      mentorTechnicalAreas: [{ technicalArea: { name: 'Backend' } }],
      mentorOrientationTypes: [],
    };
    findMany
      .mockResolvedValueOnce([
        candidate('removed', ['a', 'b']),
        candidate(remaining.id, ['a']),
      ])
      .mockResolvedValueOnce([remaining])
      .mockResolvedValueOnce([]);

    expect(await service.findSimilar(sourceId)).toEqual([
      new MentorMapper().toDirectoryResponse(remaining),
    ]);
    expect(findMany.mock.calls[1][0].where).toMatchObject({
      id: { in: ['removed', remaining.id] },
      isActive: true,
      roles: {
        some: {
          deletedAt: null,
          startAt: { lte: expect.any(Date) },
          role: { name: 'mentor' },
        },
      },
    });
  });

  it('devuelve vacío cuando el mentor no tiene áreas ni orientaciones activas', async () => {
    findFirst.mockResolvedValue(candidate(sourceId));
    expect(await service.findSimilar(sourceId)).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('lanza el error de dominio ante un origen inexistente o inactivo', async () => {
    findFirst.mockResolvedValue(null);
    await expect(service.findSimilar(sourceId)).rejects.toBeInstanceOf(
      MentorNotFoundException,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('reutiliza actividad del directorio, excluye al origen y filtra con OR por IDs', async () => {
    const now = new Date();
    findMany.mockResolvedValue([]);
    await repository.findActiveMentors(now);
    const activeWhere = findMany.mock.calls[0][0].where;
    expect(activeWhere).toEqual({
      isActive: true,
      roles: {
        some: {
          deletedAt: null,
          startAt: { lte: now },
          role: { name: 'mentor' },
        },
      },
    });
    await repository.findSimilaritySource(sourceId, now);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      ...activeWhere,
      id: sourceId,
    });
    await repository.findSimilarCandidates(sourceId, ['a'], ['o'], now);
    const query = findMany.mock.calls[1][0];
    expect(query.where).toEqual({
      ...activeWhere,
      id: { not: sourceId },
      OR: [
        { mentorTechnicalAreas: { some: { technicalAreaId: { in: ['a'] } } } },
        {
          mentorOrientationTypes: {
            some: {
              orientationTypeId: { in: ['o'] },
              orientationType: { isActive: true },
            },
          },
        },
      ],
    });
    expect(query).not.toHaveProperty('take');
    expect(query.where).not.toHaveProperty('isAvailableForMentoring');
    for (const selection of [query.select, findFirst.mock.calls[0][0].select]) {
      expect(selection).toEqual({
        id: true,
        mentorTechnicalAreas: { select: { technicalAreaId: true } },
        mentorOrientationTypes: {
          where: { orientationType: { isActive: true } },
          select: { orientationTypeId: true },
        },
      });
    }
  });

  it('delega un GET público como el perfil y valida UUID v4 con el pipe existente', async () => {
    const method = Object.getOwnPropertyDescriptor(
      MentorsController.prototype,
      'findSimilar',
    )?.value;
    const profileMethod = Object.getOwnPropertyDescriptor(
      MentorsController.prototype,
      'findOne',
    )?.value;
    expect(Reflect.getMetadata(PATH_METADATA, MentorsController)).toBe(
      'mentors',
    );
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe(':userId/similar');
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(
      RequestMethod.GET,
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, method)).toBe(
      Reflect.getMetadata(GUARDS_METADATA, profileMethod),
    );
    const args: Record<string, { pipes: ParseUUIDPipe[] }> =
      Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        MentorsController,
        'findSimilar',
      );
    const pipe = Object.values(args)[0].pipes[0];
    expect(pipe).toBeInstanceOf(ParseUUIDPipe);
    await expect(
      pipe.transform('invalid', { type: 'param' }),
    ).rejects.toThrow();
    await expect(
      pipe.transform('11111111-1111-1111-8111-111111111111', { type: 'param' }),
    ).rejects.toThrow();
    await expect(pipe.transform(sourceId, { type: 'param' })).resolves.toBe(
      sourceId,
    );
    findMany.mockResolvedValueOnce([]);
    expect(await new MentorsController(service).findSimilar(sourceId)).toEqual(
      [],
    );
    expect(findFirst.mock.calls[0][0].where.id).toBe(sourceId);
  });
});
