import type { Feedback } from "@/modules/profile";
import type { DetectedSkill } from "@/modules/matching";
import type { WorkExperienceFormValues } from "./work-experience-form-values.types";

export interface WorkExperienceFormProps {
  initialValues?: WorkExperienceFormValues;
  experienceId?: string;
  initialDetectedSkills?: DetectedSkill[];
  isPending?: boolean;
  feedback?: Feedback | null;
  onSubmit: (values: WorkExperienceFormValues) => void | Promise<void>;
  onValuesChange?: () => void;
  onCancel: () => void;
}