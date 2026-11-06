import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackMessageProps } from "../types/feedback-message-props.types";

export function FeedbackMessage({ feedback }: FeedbackMessageProps) {
  if (!feedback) {
    return null;
  }

  const isError = feedback.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn("mb-5 flex animate-in items-center gap-3 rounded-lg border px-4 py-3 text-sm duration-150 fade-in-0 slide-in-from-top-1", isError ? "border-danger/25 bg-brand-red/5 text-danger" : "border-availability-border bg-availability text-availability-foreground")}
    >
      {isError ? (
        <CircleAlert aria-hidden="true" className="size-5 shrink-0 text-danger" />
      ) : (
        <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-ink-soft" />
      )}
      <p>{feedback.message}</p>
    </div>
  );
}
