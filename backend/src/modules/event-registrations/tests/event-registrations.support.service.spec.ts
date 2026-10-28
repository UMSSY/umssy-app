import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventNotFoundException } from '../../events/exceptions/event-not-found.exception.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';
import { ProposalExpiredException } from '../exceptions/proposal-expired.exception.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';
import type { SupportTransactionResult } from '../types/support-transaction-result.types.js';

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

function buildResult(
  overrides: Partial<SupportTransactionResult> = {},
): SupportTransactionResult {
  return {
    created: true,
    supportCount: 15,
    supportThreshold: 20,
    published: false,
    ...overrides,
  };
}

describe('EventRegistrationsService.support', () => {
  let service: EventRegistrationsService;
  const registerSupport = vi.fn();

  function mockTransaction(
    context: EventSupportContext,
    result: SupportTransactionResult | null,
  ) {
    registerSupport.mockImplementation(
      async (
        _eventId: string,
        _userId: string,
        assertSupportable: (event: EventSupportContext) => void,
      ) => {
        assertSupportable(context);
        return result;
      },
    );
  }

  beforeEach(() => {
    registerSupport.mockReset();
    service = new EventRegistrationsService(new EventRegistrationsRepository({} as never), {} as never);
    vi.spyOn(service, 'registerSupport').mockImplementation(registerSupport);
  });

  it('registra el apoyo y devuelve el progreso actualizado', async () => {
    mockTransaction(buildContext(), buildResult());

    const result = await service.support('event-1', 'user-1');

    expect(registerSupport).toHaveBeenCalledWith(
      'event-1',
      'user-1',
      expect.any(Function),
    );
    expect(result).toEqual({
      eventId: 'event-1',
      status: 'voting',
      supportCount: 15,
      supportThreshold: 20,
      supportsRemaining: 5,
      progressPercent: 75,
      hasSupported: true,
    });
  });

  it('devuelve el estado Publicado cuando el apoyo completa el umbral', async () => {
    mockTransaction(
      buildContext({ supportCount: 19 }),
      buildResult({ supportCount: 20, published: true }),
    );

    const result = await service.support('event-1', 'user-1');

    expect(result.status).toBe('Publicado');
    expect(result.supportCount).toBe(20);
    expect(result.supportsRemaining).toBe(0);
    expect(result.progressPercent).toBe(100);
  });

  it('lanza 404 si el evento no existe', async () => {
    registerSupport.mockResolvedValue(null);

    await expect(service.support('missing', 'user-1')).rejects.toBeInstanceOf(
      EventNotFoundException,
    );
  });

  it('rechaza con "La propuesta ya venció" si el estado es Vencido', async () => {
    mockTransaction(buildContext({ statusTitle: 'Vencido' }), buildResult());

    const promise = service.support('event-1', 'user-1');

    await expect(promise).rejects.toBeInstanceOf(ProposalExpiredException);
    await expect(promise).rejects.toHaveProperty('statusCode', 409);
    await expect(promise).rejects.toThrow('La propuesta ya venció');
  });

  it('rechaza si la fecha límite ya pasó aunque siga en votación', async () => {
    mockTransaction(
      buildContext({ votingDeadline: new Date(Date.now() - 1000) }),
      buildResult(),
    );

    await expect(service.support('event-1', 'user-1')).rejects.toBeInstanceOf(
      ProposalExpiredException,
    );
  });

  it('rechaza eventos que no son propuestas de la comunidad', async () => {
    mockTransaction(
      buildContext({ originTitle: 'Institucional' }),
      buildResult(),
    );

    await expect(service.support('event-1', 'user-1')).rejects.toBeInstanceOf(
      EventNotSupportableException,
    );
  });

  it('rechaza propuestas que ya están publicadas', async () => {
    mockTransaction(buildContext({ statusTitle: 'Publicado' }), buildResult());

    await expect(service.support('event-1', 'user-1')).rejects.toBeInstanceOf(
      EventNotSupportableException,
    );
  });

  it('rechaza el apoyo duplicado con el mensaje del criterio de aceptación', async () => {
    mockTransaction(buildContext(), buildResult({ created: false }));

    const promise = service.support('event-1', 'user-1');

    await expect(promise).rejects.toBeInstanceOf(AlreadySupportedException);
    await expect(promise).rejects.toHaveProperty('statusCode', 409);
    await expect(promise).rejects.toThrow(
      'Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.',
    );
  });

  it('deja pasar los errores inesperados del repository', async () => {
    registerSupport.mockRejectedValue(new Error('db caída'));

    await expect(service.support('event-1', 'user-1')).rejects.toThrow(
      'db caída',
    );
  });

  it('acepta propuestas cuyo estado es "En votación"', async () => {
    mockTransaction(
      buildContext({ statusTitle: 'En votación' }),
      buildResult(),
    );

    await expect(service.support('event-1', 'user-1')).resolves.toMatchObject({
      status: 'voting',
    });
  });
});