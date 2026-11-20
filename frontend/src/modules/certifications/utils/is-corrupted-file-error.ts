import { BAD_REQUEST_STATUS } from "@/shared/constants/http.constants";

import { getHttpStatus } from "@/modules/profile";

import type { CertificationUploadError } from "../types/certification-upload-error.types";

export function isCorruptedFileError(error: unknown): boolean {
  if (getHttpStatus(error) !== BAD_REQUEST_STATUS) {
    return false;
  }

  const code = (error as CertificationUploadError).response?.data?.data?.code;
  return code === "CORRUPTED_FILE";
}
