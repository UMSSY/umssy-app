import type { ExpirationDate } from "./expiration-date.types";

export interface ExpirationDateCardProps {
  expiration: ExpirationDate;
  today?: Date;
}
