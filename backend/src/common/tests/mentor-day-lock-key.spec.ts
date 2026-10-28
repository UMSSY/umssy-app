import { describe, expect, it } from 'vitest';
import { buildMentorDayLockKey } from '../utils/mentor-day-lock-key.js';

describe('buildMentorDayLockKey', () => {
  it('arma una clave única por mentor y día', () => {
    expect(buildMentorDayLockKey('mentor-1', '2026-10-27')).toBe('mentor-day:mentor-1:2026-10-27');
  });

  it('cambia si cambia el mentor o el día', () => {
    const key = buildMentorDayLockKey('mentor-1', '2026-10-27');
    expect(buildMentorDayLockKey('mentor-2', '2026-10-27')).not.toBe(key);
    expect(buildMentorDayLockKey('mentor-1', '2026-10-28')).not.toBe(key);
  });
});
