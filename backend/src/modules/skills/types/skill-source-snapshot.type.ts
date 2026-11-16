export interface SkillSourceSnapshot {
  live: Set<string>;
  written: Set<string>;
  approved: Map<string, Set<string>>;
}
