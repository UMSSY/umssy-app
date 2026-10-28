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
export * from "./types/match-score.types";

export { RecommendedJobsView } from "./views/recommended-jobs-view";
export { JobMatchDetailView } from "./views/job-match-detail-view";
export type {
  JobMatch,
  JobRequirement,
  RecommendationsResult,
  RecommendedJob,
  RequirementStatus,
} from "./types/job-matching.types";
export { skillsAnalysisService } from "./services/skills-analysis.service";
export type { DetectedSkill, SkillsAnalysisResult } from "./types/skills-analysis.types";
