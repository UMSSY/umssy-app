import { BYTES_PER_KB, BYTES_PER_MB } from "@/shared/utils/format-file-size";

export { BYTES_PER_KB, BYTES_PER_MB };

export const MAX_FILE_SIZE_MB = 5;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_MB;

export const CV_ALLOWED_TYPES = ["application/pdf"];

export const CV_ALLOWED_EXTENSIONS = [".pdf"];

export const PHOTO_ALLOWED_TYPES = ["image/png", "image/jpeg"];

export const PHOTO_ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg"];

export const PHOTO_ACCEPT = PHOTO_ALLOWED_EXTENSIONS.join(",");
