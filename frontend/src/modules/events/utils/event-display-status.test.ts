import { describe, expect, it } from 'vitest';
import type { EventItem } from '../types/event-item.types';
import { formatVotingDeadline, getEventDisplayStatus } from './event-display-status';

const event = {
  registrationCount: 0,
  capacity: 20,
  availableSpots: 20,
} as EventItem;

describe('event display status', () => {
  it('prioritizes voting and expiration over capacity', () => {
    expect(getEventDisplayStatus({ ...event, status: 'voting', availableSpots: 0 })).toBe('voting');
    expect(getEventDisplayStatus({ ...event, status: 'Vencido', availableSpots: 0 })).toBe('expired');
  });

  it('uses published and full states for workshops', () => {
    expect(getEventDisplayStatus({ ...event, status: 'Publicado' })).toBe('published');
    expect(getEventDisplayStatus({ ...event, status: 'Publicado', availableSpots: 0 })).toBe('full');
    expect(getEventDisplayStatus(event)).toBe('published');
  });

  it('formats the support deadline in Bolivia and ignores invalid values', () => {
    expect(formatVotingDeadline('2026-10-15T02:00:00.000Z')).toMatch(/14.*oct.*2026/);
    expect(formatVotingDeadline('invalid')).toBeNull();
    expect(formatVotingDeadline(null)).toBeNull();
  });
});
