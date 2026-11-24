import { excludeWithdrawnApplications, type Application } from "@/modules/applications";

export function getAppliedJobOfferIds(applications: readonly Application[] | undefined): Set<string> {
  if (!applications) return new Set();
  return new Set(excludeWithdrawnApplications(applications).map((application) => application.jobOfferId));
}
