import type { Feedback } from "@/modules/profile";
import type { SkillItem } from "./skill-item.types";

export interface SkillPickerDialogProps {
  catalogSkills: SkillItem[];
  selectedSkills: SkillItem[];
  isSaving: boolean;
  feedback: Feedback | null;
  onClose: () => void;
  onAdd: (skill: SkillItem) => Promise<boolean>;
  onCreate: (name: string) => Promise<boolean>;
}
