import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsService } from '../services/events.service.js';

const service = new EventsService({} as never);
const event = {
  eventDate: new Date('2026-10-23T00:00:00.000Z'),
  endTime: new Date('1970-01-01T11:00:00.000Z'),
};

describe('EventsService finished event rule', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([
    ['2026-10-23T14:00:00.000Z', false],
    ['2026-10-23T15:00:00.000Z', true],
    ['2026-10-23T16:00:00.000Z', true],
  ])('classifies the event at %s', (now, expected) => {
    vi.setSystemTime(now);
    expect(service.isFinished(event)).toBe(expected);
  });

  it('converts the current instant to Bolivia date and time', () => {
    vi.setSystemTime('2026-10-24T03:30:00.000Z');
    expect(service.getFinishedEventThreshold()).toEqual({
      eventDate: new Date('2026-10-23T00:00:00.000Z'),
      endTime: new Date('1970-01-01T23:30:00.000Z'),
    });
  });

  it('compares the event date before its end time', () => {
    vi.setSystemTime('2026-10-24T00:00:00.000Z');
    expect(service.isFinished(event)).toBe(true);
    expect(
      service.isFinished({
        eventDate: new Date('2026-10-24T00:00:00.000Z'),
        endTime: new Date('1970-01-01T00:01:00.000Z'),
      }),
    ).toBe(false);
  });
});
