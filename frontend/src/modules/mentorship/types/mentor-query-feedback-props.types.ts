export type MentorQueryFeedbackProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  onClearFilters?: () => void;
  showDirectoryLink?: boolean;
};
