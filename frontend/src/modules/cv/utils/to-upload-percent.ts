import { CV_UPLOAD_PROGRESS } from "../constants/cv-upload.constants";

export function toUploadPercent(loaded: number, total: number | undefined): number | null {
  if (!total) return null;
  const percent = Math.round((loaded / total) * CV_UPLOAD_PROGRESS.max);
  return Math.min(CV_UPLOAD_PROGRESS.max, Math.max(CV_UPLOAD_PROGRESS.min, percent));
}
