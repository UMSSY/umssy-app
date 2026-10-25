import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';

describe('EventRegistrationsService (apoyo)', () => {
  let repository: EventRegistrationsService;
  let prismaMock: {
    event: { findUnique: ReturnType<typeof vi.fn> };
    eventRegistration: { create: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    prismaMock = {
      event: { findUnique: vi.fn() },
      eventRegistration: { create: vi.fn() },
    };
    repository = new EventRegistrationsService(prismaMock as never, {} as never);
  });

  describe('findEventForSupport', () => {
    it('devuelve null si el evento no existe', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(repository.findEventForSupport('x')).resolves.toBeNull();
    });

    it('aplana estado, origen y conteo de apoyos confirmados', async () => {
      const deadline = new Date('2026-10-12T23:59:00.000Z');
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'event-1',
        votingDeadline: deadline,
        supportThreshold: 20,
        status: { title: 'Votacion' },
        origin: { title: 'Comunidad' },
        _count: { registrations: 14 },
      });

      await expect(repository.findEventForSupport('event-1')).resolves.toEqual({
        id: 'event-1',
        statusTitle: 'Votacion',
        originTitle: 'Comunidad',
        votingDeadline: deadline,
        supportThreshold: 20,
        supportCount: 14,
      });
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1' },
          select: expect.objectContaining({
            _count: {
              select: {
                registrations: {
                  where: {
                    cancelledAt: null,
                    status: { title: 'Confirmada' },
                  },
                },
              },
            },
          }),
        }),
      );
    });
  });

  describe('createSupport', () => {
    it('crea la inscripción confirmada con un qrToken de 64 caracteres', async () => {
      prismaMock.eventRegistration.create.mockResolvedValue({ id: 'reg-1' });

      await expect(repository.createSupport('event-1', 'user-1')).resolves.toEqual(
        { created: true },
      );

      const args = prismaMock.eventRegistration.create.mock.calls[0][0];
      expect(args.data.event).toEqual({ connect: { id: 'event-1' } });
      expect(args.data.user).toEqual({ connect: { id: 'user-1' } });
      expect(args.data.status).toEqual({ connect: { title: 'Confirmada' } });
      expect(args.data.qrToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it('genera un qrToken distinto en cada llamada', async () => {
      prismaMock.eventRegistration.create.mockResolvedValue({ id: 'reg-1' });

      await repository.createSupport('event-1', 'user-1');
      await repository.createSupport('event-1', 'user-2');

      const [first, second] = prismaMock.eventRegistration.create.mock.calls;
      expect(first[0].data.qrToken).not.toBe(second[0].data.qrToken);
    });

    it('devuelve created=false cuando Prisma reporta violación de unique (P2002)', async () => {
      prismaMock.eventRegistration.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      await expect(repository.createSupport('event-1', 'user-1')).resolves.toEqual(
        { created: false },
      );
    });

    it('relanza cualquier otro error', async () => {
      prismaMock.eventRegistration.create.mockRejectedValue(
        Object.assign(new Error('boom'), { code: 'P1001' }),
      );

      await expect(repository.createSupport('event-1', 'user-1')).rejects.toThrow(
        'boom',
      );
    });
  });
});