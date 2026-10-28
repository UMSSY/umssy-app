import { describe, expect, it, vi } from 'vitest';
import { lockMentorDay } from '../prisma/lock-mentor-day.js';

describe('lockMentorDay', () => {
  it('toma el lock de Postgres de la transacción con la clave del mentor y el día', async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);
    const tx = { $executeRaw: executeRaw };

    await lockMentorDay(tx as never, 'mentor-1', '2026-10-27');

    const [strings, key] = executeRaw.mock.calls[0];
    expect(strings.join('?')).toBe('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))');
    expect(key).toBe('mentor-day:mentor-1:2026-10-27');
  });
});
