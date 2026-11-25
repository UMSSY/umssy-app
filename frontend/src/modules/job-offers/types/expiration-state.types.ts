import type { ExpirationStatus } from "./expiration-status.types";

export interface ExpirationState {
  status: ExpirationStatus;
  date: Date | null;
}
