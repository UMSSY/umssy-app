import { describe, expect, it, vi } from 'vitest';
import { EventRegistrationsController } from '../controllers/event-registrations.controller.js';
import type { EventRegistrationsService } from '../services/event-registrations.service.js';

describe('EventRegistrationsController', () => {
  it('delega en el service con el userId recibido', async () => {
    const expected = [{ id: 'reg-1' }];
    const findMine = vi.fn().mockResolvedValue(expected);
    const controller = new EventRegistrationsController({
      findMine,
    } as unknown as EventRegistrationsService);

    const result = await controller.findMine({
      id: 'user-1',
      email: 'user@test.com',
      roles: ['titulado'],
    });

    expect(findMine).toHaveBeenCalledWith('user-1');
    expect(result).toBe(expected);
  });

  it('delega createWithBody en el service con eventId y userId', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'reg-1' });
    const controller = new EventRegistrationsController({
      create,
    } as unknown as EventRegistrationsService);

    const result = await controller.createWithBody({ eventId: 'event-1' }, 'user-1');

    expect(create).toHaveBeenCalledWith('event-1', 'user-1');
    expect(result).toEqual({ id: 'reg-1' });
  });

  it('delega cancelById en el service con id y userId', async () => {
    const cancel = vi.fn().mockResolvedValue({ id: 'reg-1', status: 'cancelled' });
    const controller = new EventRegistrationsController({
      cancel,
    } as unknown as EventRegistrationsService);

    const result = await controller.cancelById({ id: 'reg-1' }, 'user-1');

    expect(cancel).toHaveBeenCalledWith('reg-1', 'user-1');
    expect(result).toEqual({ id: 'reg-1', status: 'cancelled' });
  });
});
