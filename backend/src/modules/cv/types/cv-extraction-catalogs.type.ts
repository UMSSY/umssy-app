import type { ProfileCityResponse } from '../../profile/responses/profile-city.response.js';
import type { CvExtractedSkillResponse } from '../responses/cv-extracted-skill.response.js';

export interface CvExtractionCatalogs {
  skills: readonly CvExtractedSkillResponse[];
  cities: readonly ProfileCityResponse[];
}
