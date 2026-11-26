import { CV_ALLOWED_EXTENSIONS, CV_ALLOWED_TYPES } from "@/modules/profile";

export const CV_FILE_INPUT_ACCEPT = [...CV_ALLOWED_TYPES, ...CV_ALLOWED_EXTENSIONS].join(",");

export const CV_UPLOAD_PROGRESS = {
  min: 0,
  max: 100,
} as const;
