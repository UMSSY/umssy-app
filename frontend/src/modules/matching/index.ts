export { MatchingView } from "./views/matching-view";
export { useMatching } from "./hooks/use-matching";
export type {
  AffinityAxis,
  AffinityAxisId,
  AxisScores,
  Candidate,
  CandidateStatus,
  CandidateWithMatch,
  Vacancy,
} from "./types/matching-types";
export * from './types/match-score.types';

export { RecommendedJobsView } from "@/modules/matching/views/recommended-jobs-view";
export { JobMatchDetailView } from "@/modules/matching/views/job-match-detail-view";
export { RequirementAnalysisView } from "@/modules/matching/views/requirement-analysis-view";
export type {
  JobMatch,
  JobRequirement,
  RecommendationsResult,
  RecommendedJob,
  RequirementStatus,
} from "@/modules/matching/types/job-matching.types";
export type {
  RequirementAnalysis,
  RequirementTermsResult,
} from "@/modules/matching/types/requirement-terms.types";
