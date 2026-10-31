"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startSession } from "@/modules/auth";
import { OTP_MAX_ATTEMPTS } from "../constants/account-activation.constants";
import { accountActivationService } from "../services/account-activation.service";
import type { ActivationFailure, ActivationResult, ActivationSession, ActivationStatus, ActivationStep } from "../types/account-activation.types";

type Busy = "loading" | "verifying" | "activating" | "resending" | null;
interface Feedback { code?: string; password?: string; general?: string; info?: string }
interface StatusData { result: ActivationResult<ActivationStatus>; offsetMs: number }

function clockOffset(serverTime: string): number {
  const parsed = Date.parse(serverTime);
  return Number.isNaN(parsed) ? 0 : parsed - Date.now();
}

export function useAccountActivation(email: string) {
  const client = useQueryClient();
  const key = useMemo(() => ["account-activation", "status", email] as const, [email]);
  const [step, setStep] = useState<ActivationStep>("code");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({});
  const [session, setSession] = useState<ActivationSession | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<StatusData> => {
      const result = await accountActivationService.getStatus(email);
      return { result, offsetMs: result.ok ? clockOffset(result.data.serverTime) : 0 };
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  const verifyMutation = useMutation({ mutationFn: (code: string) => accountActivationService.verifyCode(email, code), gcTime: 0 });
  const activateMutation = useMutation({
    mutationFn: ({ code, password }: { code: string; password: string }) => accountActivationService.activate(email, code, password),
    gcTime: 0,
  });
  const resendMutation = useMutation({ mutationFn: () => accountActivationService.resend(email), gcTime: 0 });

  const { refetch } = query;
  const refresh = useCallback(async () => { await refetch(); }, [refetch]);
  const handleCodeFailure = useCallback(async (failure: ActivationFailure) => {
    setStep("code");
    setVerifiedCode("");
    setFeedback({ code: failure.fieldErrors.code ?? failure.message });
    if (failure.reason === "code_invalid" && failure.remainingAttempts !== undefined) {
      const remaining = failure.remainingAttempts;
      client.setQueryData<StatusData>(key, (current) => current?.result.ok
        ? { ...current, result: { ok: true, data: { ...current.result.data, remainingAttempts: remaining } } }
        : current);
    } else if (failure.reason) {
      await refresh();
    }
  }, [client, key, refresh]);

  const verify = async (code: string) => {
    setFeedback({});
    try {
      const result = await verifyMutation.mutateAsync(code);
      if (!alive.current) return;
      if (result.ok) { setVerifiedCode(code); setStep("password"); }
      else await handleCodeFailure(result);
    } catch {
      if (alive.current) setFeedback({ general: "No se pudo completar la operación. Inténtalo de nuevo." });
    } finally { verifyMutation.reset(); }
  };

  const activate = async (password: string): Promise<ActivationSession | null> => {
    setFeedback({});
    try {
      const result = await activateMutation.mutateAsync({ code: verifiedCode, password });
      if (!alive.current) return null;
      if (result.ok) {
        startSession(result.data.accessToken);
        setSession(result.data);
        setVerifiedCode("");
        return result.data;
      }
      if (result.fieldErrors.password) setFeedback({ password: result.fieldErrors.password });
      else if (result.reason) await handleCodeFailure(result);
      else setFeedback({ general: result.message });
      return null;
    } catch {
      if (alive.current) setFeedback({ general: "No se pudo completar la operación. Inténtalo de nuevo." });
      return null;
    } finally { activateMutation.reset(); }
  };

  const resend = async () => {
    setFeedback({});
    try {
      const result = await resendMutation.mutateAsync();
      if (!alive.current) return;
      if (result.ok) {
        const data = result.data;
        client.setQueryData<StatusData>(key, {
          offsetMs: clockOffset(data.serverTime),
          result: { ok: true, data: { state: "ready", ...data, remainingAttempts: OTP_MAX_ATTEMPTS } },
        });
        setStep("code"); setVerifiedCode("");
        setFeedback({ info: "Te enviamos un nuevo código. Revisa tu correo." });
      } else {
        setFeedback({ general: result.message });
        if (result.reason) await refresh();
      }
    } catch {
      if (alive.current) setFeedback({ general: "No se pudo completar la operación. Inténtalo de nuevo." });
    } finally { resendMutation.reset(); }
  };

  const result = query.data?.result;
  const status = result?.ok ? result.data : null;
  const busy: Busy = verifyMutation.isPending ? "verifying" : activateMutation.isPending ? "activating"
    : resendMutation.isPending ? "resending" : query.isFetching ? "loading" : null;
  const statusError = query.isError ? "No se pudo conectar con el servidor. Inténtalo de nuevo." : result && !result.ok ? result.message : undefined;
  const displayFeedback = statusError && !feedback.general ? { ...feedback, general: statusError } : feedback;
  return {
    status, offsetMs: query.data?.offsetMs ?? 0, step, busy, feedback: displayFeedback, session,
    verify, activate, resend, refresh, goBackToCode: () => setStep("code"),
  };
}
