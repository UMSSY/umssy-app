import { describe, expect, it } from 'vitest';
import { resolveCvCityId } from '../utils/resolve-cv-city-id.js';

const cities = [
  { id: 'city-lpz', title: 'La Paz' },
  { id: 'city-scz', title: 'Santa Cruz' },
  { id: 'city-pts', title: 'Potosí' },
];

describe('resolveCvCityId', () => {
  it.each([
    ['La Paz', 'city-lpz'],
    ['SANTA CRUZ, Bolivia', 'city-scz'],
    ['potosi - Bolivia', 'city-pts'],
    ['Av. Busch 123, La Paz, Bolivia', 'city-lpz'],
  ])('matches "%s" ignoring case, accents and suffixes', (location, cityId) => {
    expect(resolveCvCityId(location, cities)).toBe(cityId);
  });

  it.each([null, '', 'Lima, Perú', 'La Pazz'])(
    'returns null when "%s" has no exact city',
    (location) => {
      expect(resolveCvCityId(location, cities)).toBeNull();
    },
  );
});
