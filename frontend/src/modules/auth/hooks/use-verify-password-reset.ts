"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import type { PasswordResetResult, VerifyResetCodePayload } from "../types/forgot-password.types";

const DEFAULT_ERROR_MESSAGE = "El código de verificación es incorrecto o ha expirado.";

export function useVerifyPasswordReset() {
  const mutation = useMutation({
    mutationFn: (payload: VerifyResetCodePayload) => authService.verifyPasswordResetCode(payload),
  });

  async function verifyResetCode(payload: VerifyResetCodePayload): Promise<PasswordResetResult> {
    try {
      await mutation.mutateAsync(payload);
      return { ok: true };
    } catch (cause: unknown) {
      return { ok: false, error: cause instanceof Error ? cause.message : DEFAULT_ERROR_MESSAGE };
    }
  }

  return { verifyResetCode, isLoading: mutation.isPending };
}
