export type SkillOrigin = "manual" | "experience" | "other";

export interface SkillItem {
  id: string;
  name: string;
  category?: string;
  origin?: SkillOrigin;
  linkedExperienceCount?: number;
  /** Only `false` hides the X; skills without this data stay removable. */
  isRemovable?: boolean;
}
