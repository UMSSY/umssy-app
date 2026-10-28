import { describe, expect, it } from 'vitest';
import { updateMentorAvailabilitySchema } from '../requests/update-mentor-availability.request.js';

describe('updateMentorAvailabilitySchema', () => {
  it.each([true, false])('acepta isAvailable=%s', (isAvailable) => {
    expect(updateMentorAvailabilitySchema.safeParse({ isAvailable }).success).toBe(true);
  });

  it.each([{}, { isAvailable: 'false' }, { isAvailable: null }])('rechaza %o', (body) => {
    const result = updateMentorAvailabilitySchema.safeParse(body);
    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual([
      'Indica si recibes solicitudes de mentoría',
    ]);
  });

  it('rechaza campos desconocidos', () => {
    expect(updateMentorAvailabilitySchema.safeParse({ isAvailable: true, mentorId: 'x' }).success).toBe(false);
  });
});
