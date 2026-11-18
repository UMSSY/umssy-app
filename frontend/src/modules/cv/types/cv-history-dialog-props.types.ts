import type { SavedCv } from "./saved-cv.types";

export interface CvHistoryDialogProps {
  isOpen: boolean;
  isDeleting?: boolean;
  onDelete: (cv: SavedCv) => Promise<void>;
  onClose: () => void;
}
