import { describe, expect, it } from 'vitest';
import { updateMentorCapacitySchema } from '../requests/update-mentor-capacity.schema.js';

describe('updateMentorCapacitySchema', () => {
  it.each([1, 25, 100])('acepta el porcentaje entero %i', (percentage) => {
    expect(
      updateMentorCapacitySchema.safeParse({ percentage }).success,
    ).toBe(true);
  });

  it.each([0, 101, 25.5, '25', null])(
    'rechaza el valor inválido %s',
    (percentage) => {
      expect(
        updateMentorCapacitySchema.safeParse({ percentage }).success,
      ).toBe(false);
    },
  );
});
