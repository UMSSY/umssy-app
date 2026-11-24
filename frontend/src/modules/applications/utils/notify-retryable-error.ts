import { toast } from "sonner";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import { isRetryableError } from "./is-retryable-error";

export function notifyRetryableError(error: unknown, message: string, retry: () => void) {
  if (!isRetryableError(error)) {
    toast.error(message);
    return;
  }
  toast.error(message, { action: { label: APPLICATION_MESSAGES.retry, onClick: retry } });
}
