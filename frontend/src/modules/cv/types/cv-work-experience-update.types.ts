import type { workExperienceService } from "@/modules/work-experience";

export type CvWorkExperienceUpdate = Parameters<typeof workExperienceService.updateWorkExperience>[1];
