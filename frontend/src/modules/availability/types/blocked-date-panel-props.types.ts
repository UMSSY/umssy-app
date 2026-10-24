import type { BlockedDate } from "./blocked-date.types";

export interface BlockedDatePanelProps {
  date: string;
  blockedDate?: BlockedDate;
  onClose: () => void;
}
