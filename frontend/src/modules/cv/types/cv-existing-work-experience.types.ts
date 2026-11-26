import type { workExperienceService } from "@/modules/work-experience";

export type CvExistingWorkExperience = Awaited<ReturnType<typeof workExperienceService.getWorkExperiences>>[number];
