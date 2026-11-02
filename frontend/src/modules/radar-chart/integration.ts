/** API pública para funcionalidades transversales con Matching y Vacantes. */
export { RADAR_AXES } from './constants/radar-axes.constants';
export type { AxisId, Scores, IntegrationRadar, ReviewRow, RealVacancy, CandidateRow, ApplicationSummary, ApplicantConsents, RecruiterResponse } from './types/radar-integration.types';
export { radarIntegrationApi } from './services/radar-integration.service';
export { RadarAreaDetailsDialog, EMPTY_AREA_EVIDENCE } from './components/radar-area-details-dialog';
export type { AreaEvidenceDetails } from './components/radar-area-details-dialog';
export {
  radarQueryKeys,
  useRadarReviews,
  useRadarReviewMutations,
  useRecruiterVacancies,
  useRecruiterApplicants,
  useRecruiterAreaEvidence,
  useRecruiterDecision,
  useMyRadarApplications,
  useRadarApplicationMutations,
} from './hooks/use-radar-integration-queries';
