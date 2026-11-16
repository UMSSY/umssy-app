import type { CvPreview } from "./cv-preview.types";

export interface CvViewerDialogProps {
  preview: CvPreview | null;
  onClose: () => void;
}
