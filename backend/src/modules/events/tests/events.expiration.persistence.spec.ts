import { EventsRepository } from '../repositories/events.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsService } from '../services/events.service.js';

describe('EventsService.expireOverdueProposals', () => {
  const findStatus = vi.fn();
  const updateMany = vi.fn();
  const now = new Date('2026-10-12T23:59:00.000Z');
  let service: EventsService;

  beforeEach(() => {
    findStatus.mockReset();
    updateMany.mockReset();
    service = new EventsService(new EventsRepository({
      eventStatus: { findUnique: findStatus },
      event: { updateMany },
    } as never));
  });

  it('pasa a Vencido solo propuestas de la comunidad en votación con el plazo cumplido', async () => {
    findStatus.mockResolvedValue({ id: 'expired-id' });
    updateMany.mockResolvedValue({ count: 2 });

    await expect(service.expireOverdueProposals(now)).resolves.toBe(2);

    expect(findStatus).toHaveBeenCalledWith({
      where: { title: 'Vencido' },
      select: { id: true },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        status: { title: { in: ['Votacion', 'En votación'] } },
        origin: { title: 'Comunidad' },
        votingDeadline: { lte: now },
      },
      data: { statusId: 'expired-id' },
    });
  });

  it('devuelve 0 cuando no hay propuestas vencidas', async () => {
    findStatus.mockResolvedValue({ id: 'expired-id' });
    updateMany.mockResolvedValue({ count: 0 });

    await expect(service.expireOverdueProposals(now)).resolves.toBe(0);
  });

  it('no actualiza nada si el estado Vencido no existe', async () => {
    findStatus.mockResolvedValue(null);

    await expect(service.expireOverdueProposals(now)).resolves.toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
