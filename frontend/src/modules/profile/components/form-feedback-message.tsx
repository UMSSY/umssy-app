import type { FormFeedback } from "../types/profile.types";

interface FormFeedbackMessageProps {
  feedback: FormFeedback | null;
}

export function FormFeedbackMessage({ feedback }: FormFeedbackMessageProps) {
  if (!feedback) {
    return null;
  }

  const isSuccess = feedback.type === "success";

  return (
    <p
      role={isSuccess ? "status" : "alert"}
      className={`rounded-lg border px-3 py-2 text-[13px] ${
        isSuccess
          ? "border-border bg-surface-soft text-ink"
          : "border-accent/30 bg-interaction text-danger"
      }`}
    >
      {feedback.message}
    </p>
  );
}
