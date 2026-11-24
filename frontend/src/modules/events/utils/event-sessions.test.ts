// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  formatSessionCount,
  formatSessionDate,
  formatSessionDateRange,
  formatSessionTimeRange,
  getNextSession,
  getScheduleBounds,
  getSortedSessions,
  hasMultipleSessions,
  toSessionSchedule,
} from './event-sessions';

const first = { id: 's1', startsAt: '2026-12-01T13:00:00.000Z', endsAt: '2026-12-01T15:00:00.000Z', location: null };
const second = { id: 's2', startsAt: '2026-12-05T22:00:00.000Z', endsAt: '2026-12-06T00:30:00.000Z', location: null };

describe('event sessions', () => {
  it('sorts sessions by start and drops invalid timestamps', () => {
    const invalid = { ...first, id: 'bad', startsAt: 'not-a-date' };
    expect(getSortedSessions({ sessions: [second, invalid, first] }).map((s) => s.id)).toEqual(['s1', 's2']);
  });

  it('treats missing or empty sessions as a single-session workshop', () => {
    expect(getSortedSessions({})).toEqual([]);
    expect(hasMultipleSessions({ sessions: [] })).toBe(false);
    expect(hasMultipleSessions({ sessions: [first] })).toBe(false);
    expect(hasMultipleSessions({ sessions: [first, second] })).toBe(true);
  });

  it('formats dates and times in La Paz time', () => {
    expect(formatSessionDate(first)).toBe('martes, 1 de diciembre');
    expect(formatSessionTimeRange(first)).toBe('09:00 - 11:00 hrs');
    // 22:00Z del 5 de diciembre son las 18:00 del mismo día en La Paz.
    expect(formatSessionDate(second)).toBe('sábado, 5 de diciembre');
    expect(formatSessionTimeRange(second)).toBe('18:00 - 20:30 hrs');
  });

  it('formats the date range and session count', () => {
    expect(formatSessionDateRange([first, second])).toMatch(/^1\s?[–-]\s?5 de diciembre$/);
    expect(formatSessionDateRange([])).toBe('Fecha por confirmar');
    expect(formatSessionCount(1)).toBe('1 sesión');
    expect(formatSessionCount(3)).toBe('3 sesiones');
  });

  it('reports unavailable values for invalid timestamps', () => {
    expect(formatSessionDate({ ...first, startsAt: 'x' })).toBe('Fecha por confirmar');
    expect(formatSessionTimeRange({ ...first, endsAt: 'x' })).toBe('Horario no disponible');
  });

  it('spans the schedule from the first start to the last end', () => {
    expect(getScheduleBounds({ date: '2026-12-01', startTime: '09:00', endTime: '11:00', sessions: [second, first] })).toEqual({
      startsAt: Date.parse(first.startsAt),
      endsAt: Date.parse(second.endsAt),
    });
    // Sin sesiones conserva el cálculo anterior (hora de Bolivia, UTC-4).
    expect(getScheduleBounds({ date: '2026-12-01', startTime: '09:00', endTime: '11:00' })).toEqual({
      startsAt: Date.parse('2026-12-01T13:00:00.000Z'),
      endsAt: Date.parse('2026-12-01T15:00:00.000Z'),
    });
  });

  it('picks the session in progress or the next one', () => {
    expect(getNextSession([first, second], Date.parse('2026-12-01T14:00:00.000Z'))).toBe(first);
    expect(getNextSession([first, second], Date.parse('2026-12-03T00:00:00.000Z'))).toBe(second);
    expect(getNextSession([first, second], Date.parse('2026-12-07T00:00:00.000Z'))).toBeNull();
  });

  it('converts a session to the local date and times used by passes', () => {
    expect(toSessionSchedule(second)).toEqual({ date: '2026-12-05', startTime: '18:00', endTime: '20:30' });
  });
});
