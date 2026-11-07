export { MatchingView } from "./views/matching-view";
export { useMatching } from "./hooks/use-matching";
export { RecruiterCandidateList } from "./components/recruiter-candidate-list";
export { RecruiterCandidatePanel } from "./components/recruiter-candidate-panel";
export {
  useRecruiterApplicants,
  useRecruiterAreaEvidence,
  useRecruiterDecision,
  useRecruiterVacancies,
  radarRecruiterQueryKeys,
} from "./hooks/use-radar-recruiter";
export { radarRecruiterApi } from "./services/radar-recruiter.service";
export { buildAreaDetail, parseDurationYears } from "./utils/build-area-detail";
export { RADAR_AXES } from "./types/radar-recruiter.types";
export type {
  AreaEvidence,
  AreaEvidenceCertification,
  AreaEvidenceEducation,
  AreaEvidenceExperience,
  PublishedEvidence,
  RadarAxis,
  RadarAxisId,
  RecruiterApplicant,
  RecruiterApplicantsResponse,
  RecruiterApplicationState,
  RecruiterComparison,
  RecruiterTarget,
  RecruiterVacancy,
} from "./types/radar-recruiter.types";
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
export { JobApplicationAction } from "./components/job-application-action";
export type {
  JobMatch,
  JobRequirement,
  RecommendationsResult,
  RecommendedJob,
  RequirementStatus,
} from "./types/job-matching.types";
export { skillsAnalysisService } from "./services/skills-analysis.service";
export type { DetectedSkill, SkillsAnalysisResult } from "./types/skills-analysis.types";
