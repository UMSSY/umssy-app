export interface ExpirationCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  today?: Date;
}
