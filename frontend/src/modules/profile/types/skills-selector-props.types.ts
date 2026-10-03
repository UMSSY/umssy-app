import { SkillItem } from "./skill-item.types";

export interface SkillsSelectorProps {
  catalogSkills: SkillItem[];
  selectedSkills: SkillItem[];
  onAddSkill: (skill: SkillItem) => void;
  onRemoveSkill: (skillId: string) => void;
  onCreateCustomSkill?: (name: string) => void;
}