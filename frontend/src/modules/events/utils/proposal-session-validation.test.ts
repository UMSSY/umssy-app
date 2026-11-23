import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasProposalSessionErrors, validateProposalSessions } from './proposal-session-validation';

const main = { eventDate: '2026-11-12', startTime: '09:00', endTime: '12:00' };

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-24T12:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('proposal session validation', () => {
  it('accepts sessions on other days and contiguous sessions on the same day', () => {
    const errors = validateProposalSessions(main, [
      { eventDate: '2026-11-19', startTime: '09:00', endTime: '12:00' },
      { eventDate: '2026-11-12', startTime: '12:00', endTime: '13:00' },
    ]);
    expect(hasProposalSessionErrors(errors)).toBe(false);
  });

  it('requires date and times and a finish after the start', () => {
    expect(validateProposalSessions(main, [{ eventDate: '', startTime: '', endTime: '' }])[0]).toEqual({
      eventDate: 'Selecciona la fecha del taller.',
      startTime: 'Selecciona la hora de inicio.',
      endTime: 'Selecciona la hora de finalización.',
    });
    expect(validateProposalSessions(main, [{ eventDate: '2026-11-19', startTime: '12:00', endTime: '09:00' }])[0].endTime)
      .toBe('La finalización debe ser posterior al inicio.');
  });

  it('applies the same date window as the main session', () => {
    expect(validateProposalSessions(main, [{ eventDate: '2026-10-25', startTime: '09:00', endTime: '10:00' }])[0].eventDate)
      .toMatch(/^Elige una fecha desde el/);
  });

  it('rejects overlaps with the main session or another session', () => {
    const errors = validateProposalSessions(main, [
      { eventDate: '2026-11-12', startTime: '11:00', endTime: '13:00' },
      { eventDate: '2026-11-19', startTime: '09:00', endTime: '11:00' },
      { eventDate: '2026-11-19', startTime: '10:30', endTime: '12:00' },
    ]);
    expect(errors.map((error) => error.startTime)).toEqual([
      'Se superpone con otra sesión.', 'Se superpone con otra sesión.', 'Se superpone con otra sesión.',
    ]);
  });
});
