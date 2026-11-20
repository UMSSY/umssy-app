import { describe, expect, it } from 'vitest';
import { isManagedWorkshopFinished } from './managed-workshop-status';
import type { ManagedWorkshop } from '../types/managed-workshop.types';

const workshop: ManagedWorkshop = {
  id: 'qa-workshop',
  title: 'Taller QA',
  eventDate: '2026-11-17',
  startTime: '00:00',
  endTime: '23:59:59.999',
  location: 'Aula QA',
};

describe('managed workshop check-in window', () => {
  it('keeps the workshop available until the exact Bolivia end instant', () => {
    expect(isManagedWorkshopFinished(workshop, Date.parse('2026-11-18T03:59:59.998Z'))).toBe(false);
    expect(isManagedWorkshopFinished(workshop, Date.parse('2026-11-18T03:59:59.999Z'))).toBe(true);
  });

  it('does not treat a malformed date or time as a finished workshop', () => {
    expect(isManagedWorkshopFinished({ ...workshop, endTime: 'bad-time' }, Date.now())).toBe(false);
    expect(isManagedWorkshopFinished({ ...workshop, eventDate: 'bad-date' }, Date.now())).toBe(false);
  });

  it('keeps a multi-session workshop open until its last session ends', () => {
    const sessions = [
      { id: 's1', startsAt: '2026-11-17T13:00:00.000Z', endsAt: '2026-11-17T16:00:00.000Z', location: null },
      { id: 's2', startsAt: '2026-11-24T13:00:00.000Z', endsAt: '2026-11-24T16:00:00.000Z', location: null },
    ];
    expect(isManagedWorkshopFinished({ ...workshop, sessions }, Date.parse('2026-11-20T12:00:00.000Z'))).toBe(false);
    expect(isManagedWorkshopFinished({ ...workshop, sessions }, Date.parse('2026-11-24T16:00:00.000Z'))).toBe(true);
  });
});
