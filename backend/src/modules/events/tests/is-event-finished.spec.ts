import { describe, expect, it } from 'vitest';
import { isEventFinished } from '../utils/is-event-finished.js';

describe('isEventFinished', () => {
  it.each([
    ['one millisecond before close', '2026-10-21T03:58:59.999Z', false],
    ['exactly at close', '2026-10-21T03:59:00.000Z', true],
    ['one millisecond after close', '2026-10-21T03:59:00.001Z', true],
  ])('handles Bolivia close crossing into the next UTC day: %s', (_, now, expected) => {
    expect(
      isEventFinished(
        new Date('2026-10-20T00:00:00.000Z'),
        new Date('1970-01-01T23:59:00.000Z'),
        new Date(now),
      ),
    ).toBe(expected);
  });
});
