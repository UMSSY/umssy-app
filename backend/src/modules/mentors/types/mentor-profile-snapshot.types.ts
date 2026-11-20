export interface MentorProfileSnapshot {
  readonly photoByteLength: number | null;
  readonly aboutMe: string | null;
  readonly hasTechnicalAreas: boolean;
  readonly hasWorkExperience: boolean;
}
