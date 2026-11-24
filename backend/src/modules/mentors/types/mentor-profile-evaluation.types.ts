import type { MentorsRepository } from '../repositories/mentors.repository.js';

type MentorProfileRecord = NonNullable<
  Awaited<ReturnType<MentorsRepository['findActiveMentorById']>>
>;

export type MentorProfileEvaluation = {
  readonly photoUrl: MentorProfileRecord['photoUrl'];
  readonly aboutMe: MentorProfileRecord['aboutMe'];
  readonly mentorTechnicalAreas: ReadonlyArray<
    MentorProfileRecord['mentorTechnicalAreas'][number]
  >;
  readonly workExperiences: ReadonlyArray<
    MentorProfileRecord['workExperiences'][number]
  >;
};
