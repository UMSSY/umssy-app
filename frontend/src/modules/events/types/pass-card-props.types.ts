export interface PassCardProps {
  title: string;
  date: string;
  status: string;
  location: string;
  registrationId: string;
  isSelected?: boolean;
  onClick?: () => void;
  /** Connects the workshop chat using the selected registration's ID. */
  onOpenChat?: (registrationId: string) => void;
}
