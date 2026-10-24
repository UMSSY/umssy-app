import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventNotFoundException } from '../../events/exceptions/event-not-found.exception.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';
import { ProposalExpiredException } from '../exceptions/proposal-expired.exception.js';
import type { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function buildContext(
  overrides: Partial<EventSupportContext> = {},
): EventSupportContext {
  return {
    id: 'event-1',
    statusTitle: 'Votacion',
    originTitle: 'Comunidad',
    votingDeadline: new Date(Date.now() + ONE_DAY_MS),
    supportThreshold: 20,
    supportCount: 14,
    ...overrides,
  };
}

describe('EventRegistrationsService.support', () => {
  let service: EventRegistrationsService;
  const findEventForSupport = vi.fn();
  const createSupport = vi.fn();

  beforeEach(() => {
    findEventForSupport.mockReset();
    createSupport.mockReset();
    service = new EventRegistrationsService({
      findByUserId: vi.fn(),
      findEventForSupport,
      createSupport,
    } as unknown as EventRegistrationsRepository);
  });

  it('registra el apoyo y devuelve el progreso actualizado', async () => {
    findEventForSupport
      .mockResolvedValueOnce(buildContext({ supportCount: 14 }))
      .mockResolvedValueOnce(buildContext({ supportCount: 15 }));
    createSupport.mockResolvedValue({ created: true });

    const result = await service.support('event-1', 'user-1');

    expect(createSupport).toHaveBeenCalledWith('event-1', 'user-1');
    expect(result).toEqual({
      eventId: 'event-1',
      supportCount: 15,
      supportThreshold: 20,
      supportsRemaining: 5,
      progressPercent: 75,
      hasSupported: true,
    });
  });

  it('accepts a proposal created by HU4 with its accented voting status', async () => {
    findEventForSupport.mockResolvedValue(buildContext({ statusTitle: 'En votación' }));
    createSupport.mockResolvedValue({ created: true });
    await expect(service.support('event-1', 'user-1')).resolves.toMatchObject({ hasSupported: true });
    expect(createSupport).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('suma 1 al contador si no puede releer el evento', async () => {
    findEventForSupport
      .mockResolvedValueOnce(buildContext({ supportCount: 14 }))
      .mockResolvedValueOnce(null);
    createSupport.mockResolvedValue({ created: true });

    const result = await service.support('event-1', 'user-1');

    expect(result.supportCount).toBe(15);
  });

  it('lanza 404 si el evento no existe', async () => {
    findEventForSupport.mockResolvedValue(null);

    await expect(service.support('missing', 'user-1')).rejects.toBeInstanceOf(
      EventNotFoundException,
    );
    expect(createSupport).not.toHaveBeenCalled();
  });

  it('rechaza con "La propuesta ya venció" si el estado es Vencido', async () => {
    findEventForSupport.mockResolvedValue(
      buildContext({ statusTitle: 'Vencido' }),
    );

    const promise = service.support('event-1', 'user-1');

    await expect(promise).rejects.toBeInstanceOf(ProposalExpiredException);
    await expect(promise).rejects.toHaveProperty('statusCode', 409);
    await expect(promise).rejects.toThrow('La propuesta ya venció');
    expect(createSupport).not.toHaveBeenCalled();
  });

  it('rechaza si la fecha límite ya pasó aunque siga en votación', async () => {
    findEventForSupport.mockResolvedValue(
      buildContext({ votingDeadline: new Date(Date.now() - 1000) }),
    );

    await expect(service.support('event-1', 'user-1')).rejects.toBeInstanceOf(
      ProposalExpiredException,
    );
    expect(createSupport).not.toHaveBeenCalled();
  });

  it('rechaza eventos que no son propuestas de la comunidad', async () => {
    findEventForSupport.mockResolvedValue(
      buildContext({ originTitle: 'Institucional' }),
    );

    await expect(service.support('event-1', 'user-1')).rejects.toBeInstanceOf(
      EventNotSupportableException,
    );
    expect(createSupport).not.toHaveBeenCalled();
  });

  it('rechaza propuestas que ya están publicadas', async () => {
    findEventForSupport.mockResolvedValue(
      buildContext({ statusTitle: 'Publicado' }),
    );

    await expect(service.support('event-1', 'user-1')).rejects.toBeInstanceOf(
      EventNotSupportableException,
    );
    expect(createSupport).not.toHaveBeenCalled();
  });

  it('rechaza el apoyo duplicado con el mensaje del criterio de aceptación', async () => {
    findEventForSupport.mockResolvedValue(buildContext());
    createSupport.mockResolvedValue({ created: false });

    const promise = service.support('event-1', 'user-1');

    await expect(promise).rejects.toBeInstanceOf(AlreadySupportedException);
    await expect(promise).rejects.toHaveProperty('statusCode', 409);
    await expect(promise).rejects.toThrow(
      'Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.',
    );
    expect(findEventForSupport).toHaveBeenCalledTimes(1);
  });

  it('deja pasar los errores inesperados del repository', async () => {
    findEventForSupport.mockResolvedValue(buildContext());
    createSupport.mockRejectedValue(new Error('db caída'));

    await expect(service.support('event-1', 'user-1')).rejects.toThrow(
      'db caída',
    );
  });
});