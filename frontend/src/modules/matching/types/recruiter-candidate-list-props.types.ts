import type { RecruiterApplicant } from "./recruiter-applicant.types";

export interface RecruiterCandidateListProps {
  query: string;
  onQueryChange: (query: string) => void;
  candidates: RecruiterApplicant[];
  selectedApplicationId: string | null;
  onSelectCandidate: (applicationId: string) => void;
}
