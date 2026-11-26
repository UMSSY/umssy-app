import { describe, expect, it } from 'vitest';
import { normalizeRegistrationName } from '../utils/normalize-registration-name.js';

describe('normalizeRegistrationName', () => {
  it.each([
    ['Acme Corp', 'acme corp'],
    ['ACME CORP', 'acme corp'],
    ['  Acme Corp  ', 'acme corp'],
    ['Acme    Corp', 'acme corp'],
    ['Acme\tCorp\n', 'acme corp'],
    ['  ACME    corp ', 'acme corp'],
    ['Ñandú Soft', 'ñandú soft'],
    ['acme_user', 'acme_user'],
    ['', ''],
    ['   ', ''],
  ])('normaliza %j como %j', (input, expected) => {
    expect(normalizeRegistrationName(input)).toBe(expected);
  });

  it('da el mismo resultado para variantes de mayúsculas y espacios del mismo nombre', () => {
    const variants = ['Tech Andina', 'tech andina', 'TECH  ANDINA', ' Tech   Andina '];

    expect(new Set(variants.map(normalizeRegistrationName)).size).toBe(1);
  });

  it('no mezcla nombres distintos ni quita las tildes', () => {
    expect(normalizeRegistrationName('Café Andino')).not.toBe(normalizeRegistrationName('Cafe Andino'));
    expect(normalizeRegistrationName('Acme Corp')).not.toBe(normalizeRegistrationName('Acme Corps'));
  });
});
