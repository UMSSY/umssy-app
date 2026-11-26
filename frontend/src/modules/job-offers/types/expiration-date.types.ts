import type { ExpirationStatus } from "./expiration-status.types";

export interface ExpirationDate {
  status: ExpirationStatus;
  selectedDate: Date | null;
  hasExpiration: boolean;
  confirmedDate: Date | null;
  isExpirationValid: boolean;
  toggleExpiration: (checked: boolean) => void;
  selectDate: (date: Date | undefined) => void;
  confirmDate: () => void;
  rejectDate: () => void;
  changeDate: () => void;
  resetExpiration: () => void;
}
