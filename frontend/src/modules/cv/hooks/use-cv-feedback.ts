"use client";

import { useEffect, useState } from "react";
import type { Feedback } from "@/modules/profile";

export function useCvFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (feedback?.type !== "success") {
      return;
    }

    const timeoutId = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeoutId);
  }, [feedback]);

  return { feedback, setFeedback };
}
