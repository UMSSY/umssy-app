import type { SavedCv } from "./saved-cv.types";

export interface CvListItemProps {
  cv: SavedCv;
  isBusy?: boolean;
  isOpening?: boolean;
  onView: (cv: SavedCv) => void;
  onDelete: (cv: SavedCv) => void;
}
