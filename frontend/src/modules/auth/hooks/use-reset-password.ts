"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import type { PasswordResetResult, ResetPasswordPayload } from "../types/forgot-password.types";

const DEFAULT_ERROR_MESSAGE = "No se pudo actualizar la contraseña.";

export function useResetPassword() {
  const mutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
  });

  async function resetPassword(payload: ResetPasswordPayload): Promise<PasswordResetResult> {
    try {
      await mutation.mutateAsync(payload);
      return { ok: true };
    } catch (cause: unknown) {
      return { ok: false, error: cause instanceof Error ? cause.message : DEFAULT_ERROR_MESSAGE };
    }
  }

  return { resetPassword, isLoading: mutation.isPending };
}
