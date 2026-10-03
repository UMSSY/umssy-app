import { CV_FILE_TYPE_LABEL } from "../config/cv-upload.config";
import type { SavedCv } from "../types/saved-cv.types";

export function createSavedCv(file: File, updatedAt: Date): SavedCv {
  return {
    fileName: file.name,
    fileType: CV_FILE_TYPE_LABEL,
    sizeInBytes: file.size,
    updatedAt,
  };
}
