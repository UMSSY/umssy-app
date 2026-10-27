export interface SupportResponse {
  eventId: string;
  status: string;
  supportCount: number;
  supportThreshold: number | null;
  supportsRemaining: number;
  progressPercent: number;
  hasSupported: boolean;
}