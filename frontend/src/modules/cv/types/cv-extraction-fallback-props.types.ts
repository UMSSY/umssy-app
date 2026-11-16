export interface CvExtractionFallbackProps {
  title: string;
  message: string;
  canRetry?: boolean;
  onRetry?: () => void;
  onManualFill: () => void;
}
