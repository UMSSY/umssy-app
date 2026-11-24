import { describe, expect, it } from 'vitest';
import { parseJobAlertMode } from '../utils/parse-job-alert-mode.js';

describe('parseJobAlertMode', () => {
  it.each(['ALL', 'MATCHING', 'HIGH_AFFINITY'] as const)(
    'conserva el modo %s',
    (mode) => {
      expect(parseJobAlertMode(mode)).toBe(mode);
    },
  );

  it.each([[null], [undefined], [''], ['matching'], ['OTRO']])(
    'usa "ALL" cuando el valor guardado es %o (AC-15.7)',
    (value) => {
      expect(parseJobAlertMode(value)).toBe('ALL');
    },
  );
});
