import { describe, expect, it } from 'vitest';
import { getEventEndTimestamp } from './event-end-timestamp';

describe('event closing time in Bolivia', () => {
  it.each(['12:00', '12:00:00', '1970-01-01T12:00:00Z'])('accepts a clock or serialized database time: %s', time => {
    expect(getEventEndTimestamp('2026-12-01T00:00:00Z', time)).toBe(Date.parse('2026-12-01T16:00:00Z'));
  });
  it('preserves seconds and milliseconds', () => {
    expect(getEventEndTimestamp('2026-12-01', '12:00:30.500')).toBe(Date.parse('2026-12-01T16:00:30.500Z'));
  });
  it('keeps the Bolivia day when the UTC closing time is on the next day', () => {
    expect(getEventEndTimestamp('2026-12-01', '23:30')).toBe(Date.parse('2026-12-02T03:30:00Z'));
  });
  it.each([['', '12:00'], ['2026-02-30', '12:00'], ['2026-12-01', ''], ['2026-12-01', '24:00']])('rejects malformed dates or times: %s %s', (date, time) => {
    expect(getEventEndTimestamp(date, time)).toBeNaN();
  });
});
