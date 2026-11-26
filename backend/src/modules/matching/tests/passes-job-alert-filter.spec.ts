import { describe, expect, it } from 'vitest';
import { JobAlertMode } from '../enums/job-alert-mode.enum.js';
import { passesJobAlertFilter } from '../utils/passes-job-alert-filter.js';

describe('passesJobAlertFilter (AC-15.5)', () => {
  it.each([0, 35, 100])('"ALL" deja pasar cualquier afinidad (%i)', (score) => {
    expect(passesJobAlertFilter(JobAlertMode.ALL, score)).toBe(true);
  });

  it.each([
    [0, false],
    [1, true],
    [69, true],
    [100, true],
  ])('"MATCHING" con afinidad %i → %s (coincide es mayor a 0 %)', (score, expected) => {
    expect(passesJobAlertFilter(JobAlertMode.MATCHING, score)).toBe(expected);
  });

  it.each([
    [0, false],
    [69, false],
    [69.9, false],
    [70, true],
    [100, true],
  ])('"HIGH_AFFINITY" con afinidad %f → %s (alta afinidad es desde 70 %)', (score, expected) => {
    expect(passesJobAlertFilter(JobAlertMode.HIGH_AFFINITY, score)).toBe(expected);
  });
});
