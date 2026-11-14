import { describe, expect, it } from 'vitest';
import { isProfessionalDescriptionMissing } from '../utils/mentor-profile-completeness.js';

describe('isProfessionalDescriptionMissing', () => {
  it.each([null, '', ' ', '   ', '\t\n\r', '\u00a0'])(
    'detects missing description %j',
    (value) => expect(isProfessionalDescriptionMissing(value)).toBe(true),
  );
  it.each(['Mentora', '  Mentora de software  ', '\nIngeniería\t', 'a'])(
    'accepts a nonempty description %j without imposing a minimum length',
    (value) => expect(isProfessionalDescriptionMissing(value)).toBe(false),
  );
});
