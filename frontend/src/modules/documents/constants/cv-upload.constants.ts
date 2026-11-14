import { CV_ALLOWED_EXTENSIONS, CV_ALLOWED_TYPES } from "@/modules/profile";

export const CV_FILE_INPUT_ACCEPT = [...CV_ALLOWED_TYPES, ...CV_ALLOWED_EXTENSIONS].join(",");
