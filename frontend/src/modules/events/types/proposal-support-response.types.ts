export interface ProposalSupportResponse {
  eventId: string;
  status: 'voting' | 'Publicado';
  supportCount: number;
  supportThreshold: number | null;
  supportsRemaining: number;
  progressPercent: number;
  hasSupported: true;
}
