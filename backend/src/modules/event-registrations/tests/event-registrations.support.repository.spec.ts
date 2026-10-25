import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';

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
    votingDeadline: new Date('2026-10-12T23:59:00.000Z'),
    supportThreshold,
    status: { title: status },
    origin: { title: origin },
    _count: { registrations },
  };
}

describe('EventRegistrationsRepository.registerSupport', () => {
  let repository: EventRegistrationsRepository;
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
    repository = new EventRegistrationsRepository(prismaMock as never);
  });

  it('bloquea la fila del evento antes de leer su estado', async () => {
    tx.event.findUnique.mockResolvedValue(buildEventRow());

    await repository.registerSupport('event-1', 'user-1', assertSupportable);

    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.event.findUnique.mock.invocationCallOrder[0],
    );
  });

  it('devuelve null y no crea nada si el evento no existe', async () => {
    tx.event.findUnique.mockResolvedValue(null);

    await expect(
      repository.registerSupport('x', 'user-1', assertSupportable),
    ).resolves.toBeNull();
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
      votingDeadline: new Date('2026-10-12T23:59:00.000Z'),
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