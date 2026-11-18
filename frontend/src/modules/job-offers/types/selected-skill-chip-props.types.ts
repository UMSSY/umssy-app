import type { SkillOption } from "./skill-option.types";

export interface SelectedSkillChipProps {
  skill: SkillOption;
  onRemove: (skill: SkillOption) => void;
}
