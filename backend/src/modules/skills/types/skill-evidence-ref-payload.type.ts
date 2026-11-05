export interface SkillEvidenceRefPayload {
  type:
    | 'work-experience'
    | 'education'
    | 'certification'
    | 'cv';
  id: string;
}