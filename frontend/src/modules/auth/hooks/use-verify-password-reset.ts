"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authService } from "../services/auth.service";
import type { VerifyResetCodePayload } from "../types/forgot-password.types";

export function useVerifyPasswordReset() {
  const mutation = useMutation({
    mutationFn: (payload: VerifyResetCodePayload) => authService.verifyPasswordResetCode(payload),
  });
  const [error, setError] = useState<string | null>(null);

  async function verifyResetCode(payload: VerifyResetCodePayload) {
    setError(null);
    try {
      return await mutation.mutateAsync(payload);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "El código de verificación es incorrecto o ha expirado.";
      setError(message);
      return null;
    }
  }

  return {
    verifyResetCode,
    isLoading: mutation.isPending,
    error,
    setError,
    reset: () => {
      setError(null);
      mutation.reset();
    },
  };
}

