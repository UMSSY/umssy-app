import { CLOSE_JOB_OFFER_TEXT } from "../constants/job-offers.constants";

export function getCloseErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return undefined;
  }

  const response = error.response;

  if (!response || typeof response !== "object" || !("status" in response)) {
    return undefined;
  }

  return typeof response.status === "number" ? response.status : undefined;
}

export function toCloseErrorMessage(error: unknown): string {
  const status = getCloseErrorStatus(error);

  if (status === 409) {
    return CLOSE_JOB_OFFER_TEXT.notClosable;
  }

  if (status !== undefined && status >= 500) {
    return CLOSE_JOB_OFFER_TEXT.server;
  }

  if (error && typeof error === "object") {
    const code = "code" in error ? error.code : undefined;
    const message = error instanceof Error ? error.message : "";

    if (
      code === "ERR_NETWORK" ||
      code === "ECONNABORTED" ||
      /network error|failed to fetch|load failed/i.test(message)
    ) {
      return CLOSE_JOB_OFFER_TEXT.network;
    }
  }

  return CLOSE_JOB_OFFER_TEXT.error;
}