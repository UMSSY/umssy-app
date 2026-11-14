export type MentorProfileSuggestionCode =
  | 'MISSING_PROFILE_PHOTO'
  | 'MISSING_PROFESSIONAL_DESCRIPTION'
  | 'MISSING_SPECIALTY'
  | 'MISSING_WORK_EXPERIENCE';

export type MentorProfileSuggestion = Readonly<
  | { code: 'MISSING_PROFILE_PHOTO'; field: 'photoUrl'; message: string }
  | {
      code: 'MISSING_PROFESSIONAL_DESCRIPTION';
      field: 'aboutMe';
      message: string;
    }
  | {
      code: 'MISSING_SPECIALTY';
      field: 'mentorTechnicalAreas';
      message: string;
    }
  | {
      code: 'MISSING_WORK_EXPERIENCE';
      field: 'workExperiences';
      message: string;
    }
>;
