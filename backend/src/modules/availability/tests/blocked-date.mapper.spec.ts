import { describe, expect, it } from 'vitest';
import type { BlockedDate } from '../../../prisma/client.js';
import { BlockedDateMapper } from '../mappers/blocked-date.mapper.js';

const blockedDate: BlockedDate = {
  id: 'blocked-1',
  mentorId: 'mentor-1',
  blockedOn: new Date('2026-10-27T00:00:00.000Z'),
  reason: 'Congreso',
  createdAt: new Date('2026-10-22T15:00:00.000Z'),
  updatedAt: new Date('2026-10-22T15:00:00.000Z'),
};

describe('BlockedDateMapper', () => {
  const mapper = new BlockedDateMapper();

  it('devuelve la fecha bloqueada como AAAA-MM-DD y el resto en ISO', () => {
    expect(mapper.toResponse(blockedDate)).toEqual({
      id: 'blocked-1',
      mentorId: 'mentor-1',
      blockedOn: '2026-10-27',
      reason: 'Congreso',
      createdAt: '2026-10-22T15:00:00.000Z',
    });
  });

  it('mantiene el motivo en null si no tiene', () => {
    expect(mapper.toResponse({ ...blockedDate, reason: null }).reason).toBeNull();
  });

  it('mapea una lista manteniendo el orden', () => {
    const second = { ...blockedDate, id: 'blocked-2', blockedOn: new Date('2026-10-28T00:00:00.000Z') };
    expect(mapper.toResponseList([blockedDate, second]).map((item) => item.blockedOn)).toEqual([
      '2026-10-27',
      '2026-10-28',
    ]);
  });

  it('arma la respuesta de desbloqueo solo con el id', () => {
    expect(mapper.toDeletedResponse(blockedDate)).toEqual({ id: 'blocked-1' });
  });
});
