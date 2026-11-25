import type { QueryClient } from "@tanstack/react-query";
import { EDUCATIONS_QUERY_KEY, educationsService } from "@/modules/educations";
import { WORK_EXPERIENCES_QUERY_KEY, workExperienceService } from "@/modules/work-experience";
import type { CvExistingRecords } from "../types/cv-existing-records.types";

export async function loadCvExistingRecords(queryClient: QueryClient): Promise<CvExistingRecords | null> {
  try {
    const [workExperiences, educations] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: WORK_EXPERIENCES_QUERY_KEY,
        queryFn: () => workExperienceService.getWorkExperiences(),
      }),
      queryClient.fetchQuery({ queryKey: EDUCATIONS_QUERY_KEY, queryFn: () => educationsService.getEducations() }),
    ]);
    return { workExperiences: workExperiences ?? [], educations: educations ?? [] };
  } catch {
    return null;
  }
}
