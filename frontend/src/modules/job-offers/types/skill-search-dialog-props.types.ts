import type { SkillOption } from "./skill-option.types";

export interface SkillSearchDialogProps {
  catalog: SkillOption[];
  selected: SkillOption[];
  isDisabled: boolean;
  onAdd: (skill: SkillOption) => void;
}
