import type { SavedCv } from "./saved-cv.types";

export interface SavedCvCardProps {
  cvs?: SavedCv[] | null;
  totalCvs?: number;
  isLoading?: boolean;
  loadError?: string | null;
  isReloading?: boolean;
  isBusy?: boolean;
  openingCvId?: string | null;
  onView: (cv: SavedCv) => void;
  onDelete: (cv: SavedCv) => void;
  onOpenHistory: () => void;
  onRetry: () => void;
}
