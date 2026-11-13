export interface OfflineStatusBannerProps {
  isOnline: boolean;
  lastUpdated: string | null;
  isStale: boolean;
  onRetry?: () => void;
}
