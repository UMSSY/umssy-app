"use client";

import { useEffect, useState } from "react";
import type { Feedback } from "@/modules/profile";
import { CV_SUCCESS_FEEDBACK_DURATION_MS } from "../constants/cv-feedback.constants";

export function useCvFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (feedback?.type !== "success") {
      return;
    }

    const timeoutId = setTimeout(() => setFeedback(null), CV_SUCCESS_FEEDBACK_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [feedback]);

  return { feedback, setFeedback };
}
