import type { SavedCv } from "./saved-cv.types";

export interface CvPreview {
  cv: SavedCv;
  file: Blob;
  previewUrl: string;
}
