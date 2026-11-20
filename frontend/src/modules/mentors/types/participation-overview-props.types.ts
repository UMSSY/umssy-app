export type ParticipationOverviewProps = {
  isActive: boolean;
  areas: string[];
  orientations: string[];
  onAction: () => void;
  onPreview: () => void;
  actionEnabled?: boolean;
};