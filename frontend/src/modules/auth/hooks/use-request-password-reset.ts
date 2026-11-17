"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { getCredentialLimit } from "../utils/auth-request-error";
import type { PasswordResetResult, RequestResetCodePayload } from "../types/forgot-password.types";

const DEFAULT_ERROR_MESSAGE = "Error al solicitar el código de recuperación.";

export function useRequestPasswordReset() {
  const mutation = useMutation({
    mutationFn: (payload: RequestResetCodePayload) => authService.requestPasswordResetCode(payload),
  });

  async function requestResetCode(payload: RequestResetCodePayload): Promise<PasswordResetResult> {
    try {
      await mutation.mutateAsync(payload);
      return { ok: true };
    } catch (cause: unknown) {
      return { ok: false, error: cause instanceof Error ? cause.message : DEFAULT_ERROR_MESSAGE, restriction: getCredentialLimit(cause) };
    }
  }

  return { requestResetCode, isLoading: mutation.isPending };
}
