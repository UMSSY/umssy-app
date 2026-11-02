export interface TimeSelectProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  isOptionHidden?: (time: string) => boolean;
}
