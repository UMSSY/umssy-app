export interface PassCardProps {
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  location: string;
  registrationId: string;
  isSelected?: boolean;
  onClick?: () => void;
  onOpenChat?: (registrationId: string) => void;
  chatDisabledReason?: string;
  isAvailableOffline?: boolean;
}
