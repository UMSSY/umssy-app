export interface OfflineStatusBannerProps {
  isOnline: boolean;
  lastUpdated: string | null;
  onRetry?: () => void;
}
