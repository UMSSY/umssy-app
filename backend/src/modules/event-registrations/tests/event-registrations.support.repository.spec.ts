import { EventsService } from '../../events/index.js';
import { EventsRepository } from '../../events/repositories/events.repository.js';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';

const VOTING_DEADLINE = new Date(Date.now() + 86_400_000);

function buildEventRow(
  overrides: Partial<{
    supportThreshold: number | null;
    registrations: number;
    status: string;
    origin: string;
  }> = {},
) {
  const { supportThreshold = 20, registrations = 14, status = 'Votacion', origin = 'Comunidad' } =
    overrides;
  return {
    id: 'event-1',
    votingDeadline: VOTING_DEADLINE,
    supportThreshold,
    status: { title: status },
    origin: { title: origin },
    _count: { registrations },
  };
}

describe('EventRegistrationsService.registerSupport', () => {
  let repository: EventRegistrationsService;
  let tx: {
    $queryRaw: ReturnType<typeof vi.fn>;
    event: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    eventRegistration: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  const assertSupportable = vi.fn();

  beforeEach(() => {
    assertSupportable.mockReset();
    tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'event-1' }]),
      event: { findUnique: vi.fn(), update: vi.fn() },
      eventRegistration: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'reg-1' }),
      },
    };
    const prismaMock = {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    repository = new EventRegistrationsService(new EventRegistrationsRepository(prismaMock as never), new EventsService(new EventsRepository(prismaMock as never)));
  });

  it('lee el estado previo, bloquea la fila y vuelve a leer el estado confirmado', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow());

    await repository.registerSupport('event-1', 'user-1', assertSupportable);

    expect(tx.event.findUnique).toHaveBeenCalledTimes(2);
    expect(tx.event.findUnique.mock.invocationCallOrder[0]).toBeLessThan(tx.$queryRaw.mock.invocationCallOrder[0]);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.event.findUnique.mock.invocationCallOrder[1]);
  });

  it('devuelve null y no crea nada si el evento no existe', async () => {
    tx.event.findUnique.mockResolvedValue(null);

    await expect(
      repository.registerSupport('x', 'user-1', assertSupportable),
    ).resolves.toBeNull();
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(assertSupportable).not.toHaveBeenCalled();
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('entrega el contexto aplanado a la validación', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow());

    await repository.registerSupport('event-1', 'user-1', assertSupportable);

    expect(assertSupportable).toHaveBeenCalledWith({
      id: 'event-1',
      statusTitle: 'Votacion',
      originTitle: 'Comunidad',
      votingDeadline: VOTING_DEADLINE,
      supportThreshold: 20,
      supportCount: 14,
    });
  });

  it('propaga el error de la validación sin crear ni publicar', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow());
    assertSupportable.mockImplementation(() => {
      throw new Error('no apoyable');
    });

    await expect(
      repository.registerSupport('event-1', 'user-1', assertSupportable),
    ).rejects.toThrow('no apoyable');
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
    expect(tx.event.update).not.toHaveBeenCalled();
  });

  it('devuelve created=false si el usuario ya apoyó, sin crear ni publicar', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow());
    tx.eventRegistration.findUnique.mockResolvedValue({ id: 'reg-0' });

    await expect(
      repository.registerSupport('event-1', 'user-1', assertSupportable),
    ).resolves.toEqual({
      created: false,
      supportCount: 14,
      supportThreshold: 20,
      published: false,
    });
    expect(tx.eventRegistration.findUnique).toHaveBeenCalledWith({
      where: { eventId_userId: { eventId: 'event-1', userId: 'user-1' } },
      select: { id: true },
    });
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
    expect(tx.event.update).not.toHaveBeenCalled();
  });

  it('reconoce el apoyo duplicado aunque la propuesta se haya publicado mientras esperaba', async () => {
    tx.event.findUnique
      .mockResolvedValueOnce(buildEventRow({ registrations: 19 }))
      .mockResolvedValueOnce(buildEventRow({ registrations: 20, status: 'Publicado' }));
    tx.eventRegistration.findUnique.mockResolvedValue({ id: 'reg-0' });

    await expect(repository.registerSupport('event-1', 'user-1', assertSupportable))
      .resolves.toMatchObject({ created: false, supportCount: 20 });

    expect(assertSupportable).not.toHaveBeenCalled();
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('devuelve ALREADY_SUPPORTED al reintentar después de publicar', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow({ registrations: 20, status: 'Publicado' }));
    tx.eventRegistration.findUnique.mockResolvedValue({ id: 'reg-0' });

    await expect(repository.support('event-1', 'user-1')).rejects.toBeInstanceOf(AlreadySupportedException);
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('confirma al segundo titulado simultáneo sin volver a publicar', async () => {
    tx.event.findUnique
      .mockResolvedValueOnce(buildEventRow({ registrations: 19 }))
      .mockResolvedValueOnce(buildEventRow({ registrations: 20, status: 'Publicado' }));

    const result = await repository.registerSupport('event-1', 'user-2', assertSupportable);

    expect(assertSupportable).toHaveBeenCalledWith(expect.objectContaining({ statusTitle: 'Votacion', supportCount: 19 }));
    expect(tx.eventRegistration.create).toHaveBeenCalledTimes(1);
    expect(tx.event.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ created: true, supportCount: 21, published: true });
  });

  it('responde Publicado al segundo titulado que comenzó mientras seguía en votación', async () => {
    tx.event.findUnique
      .mockResolvedValueOnce(buildEventRow({ registrations: 19 }))
      .mockResolvedValueOnce(buildEventRow({ registrations: 20, status: 'Publicado' }));

    await expect(repository.support('event-1', 'user-2')).resolves.toMatchObject({
      status: 'Publicado', supportCount: 21, supportsRemaining: 0, progressPercent: 100, hasSupported: true,
    });
    expect(tx.event.update).not.toHaveBeenCalled();
  });

  it('confirma dos apoyos simultáneos con una sola publicación', async () => {
    let supportCount = 19;
    let status = 'Votacion';
    let firstReads = 0;
    let releaseReads!: () => void;
    let releaseFirst!: () => void;
    const bothRead = new Promise<void>((resolve) => { releaseReads = resolve; });
    const firstCommitted = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const create = vi.fn().mockImplementation(async () => {
      supportCount += 1;
      return { id: `reg-${supportCount}` };
    });
    const update = vi.fn().mockImplementation(async () => {
      status = 'Publicado';
      return { id: 'event-1' };
    });
    function transactionClient(waitForFirst: boolean) {
      let reads = 0;
      return {
        $queryRaw: vi.fn(async () => {
          if (waitForFirst) await firstCommitted;
          return [{ id: 'event-1' }];
        }),
        event: {
          findUnique: vi.fn(async () => {
            reads += 1;
            if (reads === 1) {
              firstReads += 1;
              if (firstReads === 2) releaseReads();
              await bothRead;
              return buildEventRow({ registrations: 19 });
            }
            return buildEventRow({ registrations: supportCount, status });
          }),
          update,
        },
        eventRegistration: { findUnique: vi.fn().mockResolvedValue(null), create },
      };
    }
    const first = transactionClient(false);
    const second = transactionClient(true);
    let attempts = 0;
    const prismaMock = {
      $transaction: vi.fn(async (callback: (client: typeof first) => Promise<unknown>) => {
        const client = attempts++ === 0 ? first : second;
        try { return await callback(client); }
        finally { if (client === first) releaseFirst(); }
      }),
    };
    const concurrent = new EventRegistrationsService(new EventRegistrationsRepository(prismaMock as never), new EventsService(new EventsRepository(prismaMock as never)));

    const responses = await Promise.all([
      concurrent.support('event-1', 'user-1'),
      concurrent.support('event-1', 'user-2'),
    ]);

    expect(responses).toMatchObject([
      { status: 'Publicado', supportCount: 20, hasSupported: true },
      { status: 'Publicado', supportCount: 21, hasSupported: true },
    ]);
    expect(create).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(1);
    expect(supportCount).toBe(21);
  });

  it('rechaza un apoyo nuevo enviado después de la publicación', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow({ registrations: 20, status: 'Publicado' }));
    const rejectPublished = vi.fn((event: { statusTitle: string }) => {
      if (event.statusTitle === 'Publicado') throw new Error('no apoyable');
    });

    await expect(repository.registerSupport('event-1', 'user-2', rejectPublished))
      .rejects.toThrow('no apoyable');

    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('mantiene EVENT_NOT_SUPPORTABLE si el apoyo comienza tras la publicación', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow({ registrations: 20, status: 'Publicado' }));

    await expect(repository.support('event-1', 'user-2')).rejects.toBeInstanceOf(EventNotSupportableException);
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('crea la inscripción confirmada con un qrToken de 64 caracteres', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow());

    const result = await repository.registerSupport(
      'event-1',
      'user-1',
      assertSupportable,
    );

    const args = tx.eventRegistration.create.mock.calls[0][0];
    expect(args.data.event).toEqual({ connect: { id: 'event-1' } });
    expect(args.data.user).toEqual({ connect: { id: 'user-1' } });
    expect(args.data.status).toEqual({ connect: { title: 'Confirmada' } });
    expect(args.data.qrToken).toMatch(/^[0-9a-f]{64}$/);
    expect(result).toEqual({
      created: true,
      supportCount: 15,
      supportThreshold: 20,
      published: false,
    });
    expect(tx.event.update).not.toHaveBeenCalled();
  });

  it('publica el evento cuando el apoyo completa el umbral', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow({ registrations: 19 }));

    const result = await repository.registerSupport(
      'event-1',
      'user-1',
      assertSupportable,
    );

    expect(tx.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { status: { connect: { title: 'Publicado' } } },
      select: { id: true },
    });
    expect(result).toMatchObject({ supportCount: 20, published: true });
  });

  it('publica con el umbral mínimo de 8 apoyos', async () => {
    tx.event.findUnique.mockResolvedValue(
      buildEventRow({ supportThreshold: 8, registrations: 7 }),
    );

    const result = await repository.registerSupport(
      'event-1',
      'user-1',
      assertSupportable,
    );

    expect(result).toMatchObject({ supportCount: 8, published: true });
    expect(tx.event.update).toHaveBeenCalledTimes(1);
  });

  it.each([null, 0])(
    'no publica nunca si el umbral es %s',
    async (supportThreshold) => {
      tx.event.findUnique.mockResolvedValue(
        buildEventRow({ supportThreshold, registrations: 50 }),
      );

      const result = await repository.registerSupport(
        'event-1',
        'user-1',
        assertSupportable,
      );

      expect(result?.published).toBe(false);
      expect(tx.event.update).not.toHaveBeenCalled();
    },
  );
});
