import { Injectable } from '@nestjs/common';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import type { MentorProfileSuggestion } from '../types/mentor-profile-suggestion.types.js';
import {
  isMentorSpecialtyMissing,
  isProfessionalDescriptionMissing,
  isProfilePhotoMissing,
  isWorkExperienceMissing,
} from '../utils/mentor-profile-completeness.js';

@Injectable()
export class MentorProfileSuggestionsService {
  constructor(private readonly mentorsRepository: MentorsRepository) {}

  async findSuggestions(userId: string): Promise<MentorProfileSuggestion[]> {
    const mentor = await this.mentorsRepository.findActiveMentorProfileSnapshot(
      userId,
      new Date(),
    );
    if (!mentor) return [];

    const suggestions: MentorProfileSuggestion[] = [];
    if (isProfilePhotoMissing(mentor.photoByteLength)) {
      suggestions.push({
        code: 'MISSING_PROFILE_PHOTO',
        field: 'photoUrl',
        message: 'Agrega una fotografía a tu perfil.',
      });
    }
    if (isProfessionalDescriptionMissing(mentor.aboutMe)) {
      suggestions.push({
        code: 'MISSING_PROFESSIONAL_DESCRIPTION',
        field: 'aboutMe',
        message: 'Completa tu descripción profesional.',
      });
    }
    if (isMentorSpecialtyMissing(mentor.hasTechnicalAreas)) {
      suggestions.push({
        code: 'MISSING_SPECIALTY',
        field: 'mentorTechnicalAreas',
        message: 'Agrega al menos un área técnica como especialidad.',
      });
    }
    if (isWorkExperienceMissing(mentor.hasWorkExperience)) {
      suggestions.push({
        code: 'MISSING_WORK_EXPERIENCE',
        field: 'workExperiences',
        message: 'Registra tu experiencia laboral.',
      });
    }
    return suggestions;
  }
}
