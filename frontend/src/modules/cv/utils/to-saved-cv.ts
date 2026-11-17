import type { CvResponse } from "../types/cv-response.types";
import type { SavedCv } from "../types/saved-cv.types";

export function toSavedCv(response: CvResponse): SavedCv {
  return {
    id: response.id,
    fileName: response.fileName,
    fileType: "PDF",
    sizeInBytes: response.sizeInBytes,
    updatedAt: new Date(response.updatedAt),
    isCurrent: response.isCurrent,
  };
}
