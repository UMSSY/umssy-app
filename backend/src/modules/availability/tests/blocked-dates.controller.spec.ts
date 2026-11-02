import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { BlockedDatesController } from '../controllers/blocked-dates.controller.js';

const USER = { id: 'mentor-1', email: 'mentor.a@umssy.test', roles: ['mentor'] };
const QUERY = { from: '2026-10-26T04:00:00.000Z', to: '2026-11-02T03:59:59.999Z' };

const handlerOf = (name: 'blockDate' | 'findBlockedDates' | 'unblockDate') =>
  Object.getOwnPropertyDescriptor(BlockedDatesController.prototype, name)?.value;

describe('BlockedDatesController', () => {
  const service = {
    blockDate: vi.fn().mockResolvedValue({ id: 'blocked-1' }),
    findBlockedDates: vi.fn().mockResolvedValue([]),
    unblockDate: vi.fn().mockResolvedValue({ id: 'blocked-1' }),
  };
  const controller = new BlockedDatesController(service as never);

  it('bloquea con el mentor en sesión y el cuerpo recibido', async () => {
    const body = { blockedOn: '2026-10-27', reason: null };
    await expect(controller.blockDate(USER, body)).resolves.toEqual({ id: 'blocked-1' });
    expect(service.blockDate).toHaveBeenCalledWith('mentor-1', body);
  });

  it('lista con el mentor en sesión y el rango recibido', async () => {
    await controller.findBlockedDates(USER, QUERY);
    expect(service.findBlockedDates).toHaveBeenCalledWith('mentor-1', QUERY);
  });

  it('desbloquea con el mentor en sesión y el id de la ruta', async () => {
    await controller.unblockDate(USER, 'blocked-1');
    expect(service.unblockDate).toHaveBeenCalledWith('mentor-1', 'blocked-1');
  });

  it.each(['blockDate', 'findBlockedDates', 'unblockDate'] as const)('%s exige el rol mentor', (name) => {
    expect(new Reflector().get<string[]>(ROLES_KEY, handlerOf(name))).toEqual(['mentor']);
  });
});
