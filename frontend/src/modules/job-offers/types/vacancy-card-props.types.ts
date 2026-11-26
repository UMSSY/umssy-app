import type { JobOffer } from "./job-offer.types";

export interface VacancyCardProps {
  offer: JobOffer;
  onDetails: (id: string) => void;
  showStatus?: boolean;
  onReopen?: (id: string) => void;
  onClose?: (offer: JobOffer) => void;
  onDelete?: (offer: JobOffer) => void;
}
