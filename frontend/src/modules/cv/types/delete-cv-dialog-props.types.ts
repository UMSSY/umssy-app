import type { SavedCv } from "./saved-cv.types";

export interface DeleteCvDialogProps {
  cv: SavedCv | null;
  hasOtherCvs: boolean;
  isDeleting?: boolean;
  onConfirm: (cv: SavedCv) => void;
  onCancel: () => void;
}
