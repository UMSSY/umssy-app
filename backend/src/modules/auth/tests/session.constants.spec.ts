import { describe, expect, it } from 'vitest';
import {
  SESSION_IDLE_MS,
  SESSION_IDLE_SECONDS,
  SESSION_MAX_MS,
  SESSION_WARNING_MS,
  SESSION_WARNING_SECONDS,
} from '../constants/session.constants.js';

describe('session constants', () => {
  it('expresses the agreed 8 hour cap, 15 minute idle time and 3 minute warning', () => {
    expect(SESSION_MAX_MS).toBe(8 * 60 * 60 * 1000);
    expect(SESSION_IDLE_MS).toBe(15 * 60 * 1000);
    expect(SESSION_WARNING_MS).toBe(3 * 60 * 1000);
  });

  it('exposes the seconds the frontend will read', () => {
    expect(SESSION_IDLE_SECONDS).toBe(900);
    expect(SESSION_WARNING_SECONDS).toBe(180);
  });

  it('warns before the idle time runs out and never exceeds the cap', () => {
    expect(SESSION_WARNING_MS).toBeLessThan(SESSION_IDLE_MS);
    expect(SESSION_IDLE_MS).toBeLessThan(SESSION_MAX_MS);
  });
});
