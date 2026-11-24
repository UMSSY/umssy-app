import { describe, expect, it } from 'vitest';
import { jobAlertPreferenceSchema } from '../requests/job-alert-preference.schema.js';

describe('jobAlertPreferenceSchema', () => {
  it.each(['ALL', 'MATCHING', 'HIGH_AFFINITY'])('acepta el modo %s', (mode) => {
    expect(jobAlertPreferenceSchema.safeParse({ mode }).success).toBe(true);
  });

  it.each([[''], ['all'], ['NONE'], [1], [null], [undefined]])(
    'rechaza el modo %o',
    (mode) => {
      const result = jobAlertPreferenceSchema.safeParse({ mode });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(['mode']);
    },
  );

  it('usa un mensaje claro cuando el modo no es válido', () => {
    const result = jobAlertPreferenceSchema.safeParse({ mode: 'NONE' });

    expect(result.error?.issues[0]?.message).toBe('La preferencia de avisos no es válida');
  });

  it('rechaza campos que no forman parte de la preferencia', () => {
    expect(
      jobAlertPreferenceSchema.safeParse({ mode: 'ALL', userId: 'otro' }).success,
    ).toBe(false);
  });
});
