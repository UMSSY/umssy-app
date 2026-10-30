"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authService } from "../services/auth.service";
import type { ResetPasswordPayload } from "../types/forgot-password.types";

export function useResetPassword() {
  const mutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
  });
  const [error, setError] = useState<string | null>(null);

  async function resetPassword(payload: ResetPasswordPayload) {
    setError(null);
    try {
      return await mutation.mutateAsync(payload);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "No se pudo actualizar la contraseña.";
      setError(message);
      return null;
    }
  }

  return {
    resetPassword,
    isLoading: mutation.isPending,
    error,
    setError,
    reset: () => {
      setError(null);
      mutation.reset();
    },
  };
}

