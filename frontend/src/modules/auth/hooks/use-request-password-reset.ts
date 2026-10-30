"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authService } from "../services/auth.service";
import type { RequestResetCodePayload } from "../types/forgot-password.types";

export function useRequestPasswordReset() {
  const mutation = useMutation({
    mutationFn: (payload: RequestResetCodePayload) => authService.requestPasswordResetCode(payload),
  });
  const [error, setError] = useState<string | null>(null);

  async function requestResetCode(payload: RequestResetCodePayload) {
    setError(null);
    try {
      return await mutation.mutateAsync(payload);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Error al solicitar el código de recuperación.";
      setError(message);
      return null;
    }
  }

  return {
    requestResetCode,
    isLoading: mutation.isPending,
    error,
    setError,
    reset: () => {
      setError(null);
      mutation.reset();
    },
  };
}

