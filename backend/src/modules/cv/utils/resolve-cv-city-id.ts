import type { ProfileCityResponse } from '../../profile/responses/profile-city.response.js';
import { normalizeTerm } from '../../nlp/utils/normalize-term.js';
import { CV_LOCATION_PART_SEPARATOR_PATTERN } from '../constants/cv-extraction.constants.js';

export function resolveCvCityId(
  location: string | null,
  cities: readonly ProfileCityResponse[],
): string | null {
  const candidates = [
    location ?? '',
    ...(location ?? '').split(CV_LOCATION_PART_SEPARATOR_PATTERN),
  ]
    .map(normalizeTerm)
    .filter(Boolean);
  return (
    cities.find((city) => candidates.includes(normalizeTerm(city.title)))?.id ??
    null
  );
}
