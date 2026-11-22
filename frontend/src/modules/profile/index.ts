export { PersonalInfoView } from './views/personal-info-view';
export { PresentationView } from './views/presentation-view';
export { ProfileOverviewView } from './views/profile-overview-view';
export { ProfileSettingsView } from './views/profile-settings-view';

export { ConfirmDeleteDialog } from './components/confirm-delete-dialog';
export { DetectedSkillsChips } from './components/detected-skills-chips';
export { FeedbackMessage } from './components/feedback-message';
export { FormField } from './components/form-field';
export { ProfilePageLayout } from './components/profile-page-layout';
export { ProfileCompletenessProgress } from './components/profile-completeness-progress';
export { SectionCard } from './components/section-card';
export { SocialAccountConnectButtons } from './components/social-account-connect-buttons';
export { GithubOAuthCallback } from './components/github-oauth-callback';
export { PortfolioProjectCard } from './components/portfolio-project-card';
export { PortfolioProfileSection } from './components/portfolio-profile-section';
export { PortfolioSelectionDialog } from './components/portfolio-selection-dialog';

export type { Feedback } from './types/feedback.types';
export type { PersonalInfoValues } from './types/personal-info-values.types';
export type { ProfileResponse } from './types/profile-response.types';
export { toPersonalInfoValues } from './utils/to-personal-info-values';
export type { FeedbackType } from './types/feedback-type.types';
export { profileService } from './services/profile.service';

export { formatFileSize } from './utils/format-file-size';
export {
  getFieldErrorProps,
  getFieldErrorId,
} from './utils/get-field-error-props';
export { trimFormValues } from './utils/trim-form-values';
export {
  CV_ALLOWED_EXTENSIONS,
  CV_ALLOWED_TYPES,
} from './config/file-upload.config';
export type { UploadedDocumentInfo } from './types/uploaded-document-info.types';

export type { ApiResponse } from './types/api-response.types';
export { getAuthHeaders } from './utils/get-auth-headers';
export { getHttpStatus } from './utils/get-http-status';

export { FILE_VALIDATION_MESSAGES } from './config/file-validation-messages.config';
export { validateFile } from './utils/validate-file';

export type { HttpError } from './types/http-error.types';

export { useProfile } from './hooks/use-profile';
export { PROFILE_ME_QUERY_KEY } from './constants/profile.constants';
export { useCities } from './hooks/use-cities';
export {
  useProfileSkillsRadar,
  PROFILE_SKILLS_RADAR_QUERY_KEY,
} from './hooks/use-profile-skills-radar';
export { profileSkillsRadarService } from './services/profile-skills-radar.service';
export { useInvalidateProfileCompleteness } from './hooks/use-invalidate-profile-completeness';
export { useProfileCompletionRequest } from './hooks/use-profile-completion-request';
export { useProfileCompletionFocus } from './hooks/use-profile-completion-focus';

export { ProfileGuideMascot } from './components/profile-guide-mascot';
export { ProfileGuideWelcomeHero } from './components/profile-guide-welcome-hero';
export { ProfileGuideCelebration } from './components/profile-guide-celebration';
export { ProfileGuideBubble } from './components/profile-guide-bubble';
export { ProfileGuideReveal } from './components/profile-guide-reveal';
export { ProfileGuidePop } from './components/profile-guide-pop';
export { usePrefersReducedMotion } from './hooks/use-prefers-reduced-motion';
export { useCountUp } from './hooks/use-count-up';
export type { ProfileGuidePose } from './types/profile-guide-pose.types';
export type { ProfileGuideStepDirection } from './types/profile-guide-step-direction.types';
export { ProfileGuideProvider } from './components/profile-guide-provider';
export { ProfileGuideDashboardCard } from './components/profile-guide-dashboard-card';
export { useProfileGuide } from './contexts/profile-guide-context';
export { useProfileCompleteness } from './hooks/use-profile-completeness';
export {
  usePortfolioAccounts,
  useStartPortfolioOAuth,
  useCompletePortfolioOAuth,
  useDisconnectPortfolioAccount,
} from './hooks/use-portfolio-accounts';
export { portfolioAccountsService } from './services/portfolio-accounts.service';
export {
  PORTFOLIO_ACCOUNTS_QUERY_KEY,
  PORTFOLIO_PROVIDERS,
  PORTFOLIO_PROVIDER_LABELS,
  PORTFOLIO_ACCOUNT_MESSAGES,
} from './constants/portfolio-accounts.constants';
export type { PortfolioAccountDisconnectResponse } from './types/portfolio-account-disconnect-response.types';
export type { PortfolioAccountStatusResponse } from './types/portfolio-account-status-response.types';
export type { PortfolioConnectedAccountResponse } from './types/portfolio-connected-account-response.types';
export type { PortfolioOAuthCallbackPayload } from './types/portfolio-oauth-callback-payload.types';
export type { PortfolioOAuthUrlResponse } from './types/portfolio-oauth-url-response.types';
export type { PortfolioProviderName } from './types/portfolio-provider-name.types';
export type { SocialAccountConnectButtonsProps } from './types/social-account-connect-buttons-props.types';
export {
  usePortfolioProjects,
  usePortfolioRepositories,
  useUpdatePortfolioProjects,
  useSyncPortfolioProjects,
} from './hooks/use-portfolio-projects';
export { portfolioProjectsService } from './services/portfolio-projects.service';
export {
  PORTFOLIO_PROJECTS_QUERY_KEY,
  PORTFOLIO_REPOSITORIES_QUERY_KEY,
  PORTFOLIO_PROJECTS_MESSAGES,
  PORTFOLIO_SELECTION_MESSAGES,
  MAX_PORTFOLIO_PROJECTS,
} from './constants/portfolio-projects.constants';
export type {
  PortfolioProjectItem,
  UpdatePortfolioProjectItemPayload,
  UpdatePortfolioProjectsPayload,
  PortfolioProjectCardProps,
  PortfolioProfileSectionProps,
  ExternalRepositoryItem,
  PortfolioProviderFilter,
  PortfolioSelectionDialogProps,
} from './types/portfolio-project.types';

export { profilePhotoService } from './services/profile-photo.service';
