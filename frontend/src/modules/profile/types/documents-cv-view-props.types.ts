import type { SavedCv } from "./saved-cv.types";

export interface DocumentsCvViewProps {
  uploadCv?: (file: File) => Promise<SavedCv>;
  deleteCv?: () => Promise<void>;
}
