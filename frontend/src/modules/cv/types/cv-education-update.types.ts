import type { educationsService } from "@/modules/educations";

export type CvEducationUpdate = Parameters<typeof educationsService.updateEducation>[1];
