"use client";

import { useMutation } from "@tanstack/react-query";
import { radarRecruiterApi } from "../services/radar-recruiter.service";

const CV_OBJECT_URL_LIFETIME_MS = 60_000;

export function useRecruiterCv(applicationId: string) {
  return useMutation({
    mutationFn: () => radarRecruiterApi.recruiterCv(applicationId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), CV_OBJECT_URL_LIFETIME_MS);
    },
  });
}
