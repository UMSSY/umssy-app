export interface SupportResponse {
  eventId: string;
  supportCount: number;
  supportThreshold: number | null;
  supportsRemaining: number;
  progressPercent: number;
  hasSupported: boolean;
}