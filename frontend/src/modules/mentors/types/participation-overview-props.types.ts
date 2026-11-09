export type ParticipationOverviewProps = {
  isActive: boolean;
  areas: string[];
  orientations: string[];
  onAction: () => void;
  actionEnabled?: boolean;
};
