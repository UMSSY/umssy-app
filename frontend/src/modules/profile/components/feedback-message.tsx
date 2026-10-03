import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FEEDBACK_BASE_CLASS,
  FEEDBACK_ERROR_CLASS,
  FEEDBACK_ERROR_ICON_CLASS,
  FEEDBACK_SUCCESS_CLASS,
  FEEDBACK_SUCCESS_ICON_CLASS,
} from "../config/feedback-styles.config";
import type { FeedbackMessageProps } from "../types/feedback-message-props.types";

export function FeedbackMessage({ feedback }: FeedbackMessageProps) {
  const isError = feedback.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(FEEDBACK_BASE_CLASS, isError ? FEEDBACK_ERROR_CLASS : FEEDBACK_SUCCESS_CLASS)}
    >
      {isError ? (
        <CircleAlert aria-hidden="true" className={FEEDBACK_ERROR_ICON_CLASS} />
      ) : (
        <CircleCheck aria-hidden="true" className={FEEDBACK_SUCCESS_ICON_CLASS} />
      )}
      <p>{feedback.message}</p>
    </div>
  );
}
