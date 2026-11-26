import type { educationsService } from "@/modules/educations";

export type CvExistingEducation = Awaited<ReturnType<typeof educationsService.getEducations>>[number];
