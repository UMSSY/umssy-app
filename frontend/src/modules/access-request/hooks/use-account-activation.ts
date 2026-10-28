"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startSession } from "@/modules/auth/utils/session";
import { OTP_MAX_ATTEMPTS } from "../constants/account-activation.constants";
import { accountActivationService } from "../services/account-activation.service";
import type {
  ActivationFailure,
  ActivationResend,
  ActivationSession,
  ActivationStatus,
  ActivationStep,
} from "../types/account-activation.types";

type Busy = "loading" | "verifying" | "activating" | "resending" | null;

interface Feedback {
  code?: string;
  password?: string;
  general?: string;
  info?: string;
}

// Orquesta el paso 4: consulta el estado, valida el código, activa la cuenta y reenvía el código
export function useAccountActivation(email: string) {
  const [status, setStatus] = useState<ActivationStatus | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [step, setStep] = useState<ActivationStep>("code");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [busy, setBusy] = useState<Busy>("loading");
  const [feedback, setFeedback] = useState<Feedback>({});
  const [session, setSession] = useState<ActivationSession | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const applyTimes = useCallback((serverTime: string) => {
    const parsed = Date.parse(serverTime);
    if (!Number.isNaN(parsed)) setOffsetMs(parsed - Date.now());
  }, []);

  const refresh = useCallback(async () => {
    const result = await accountActivationService.getStatus(email);
    if (!alive.current) return;
    if (result.ok) {
      applyTimes(result.data.serverTime);
      setStatus(result.data);
    } else {
      setFeedback({ general: result.message });
    }
    setBusy(null);
  }, [email, applyTimes]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  // Un fallo del código puede cambiar el estado (expirado, bloqueado): se vuelve a consultar
  const handleCodeFailure = useCallback(
    async (failure: ActivationFailure) => {
      setStep("code");
      setVerifiedCode("");
      setFeedback({ code: failure.fieldErrors.code ?? failure.message });
      if (failure.reason === "code_invalid" && failure.remainingAttempts !== undefined) {
        const remaining = failure.remainingAttempts;
        setStatus((current) => (current ? { ...current, remainingAttempts: remaining } : current));
        return;
      }
      if (failure.reason) await refresh();
    },
    [refresh],
  );

  const verify = useCallback(
    async (code: string) => {
      setBusy("verifying");
      setFeedback({});
      const result = await accountActivationService.verifyCode(email, code);
      if (!alive.current) return;
      if (result.ok) {
        setVerifiedCode(code);
        setStep("password");
      } else {
        await handleCodeFailure(result);
      }
      if (alive.current) setBusy(null);
    },
    [email, handleCodeFailure],
  );

  const activate = useCallback(
    async (password: string) => {
      setBusy("activating");
      setFeedback({});
      const result = await accountActivationService.activate(email, verifiedCode, password);
      if (!alive.current) return null;
      if (result.ok) {
        startSession(result.data.accessToken);
        setSession(result.data);
        return result.data;
      }
      if (result.fieldErrors.password) {
        setFeedback({ password: result.fieldErrors.password });
      } else if (result.reason) {
        await handleCodeFailure(result);
      } else {
        setFeedback({ general: result.message });
      }
      setBusy(null);
      return null;
    },
    [email, verifiedCode, handleCodeFailure],
  );

  const resend = useCallback(async () => {
    setBusy("resending");
    setFeedback({});
    const result = await accountActivationService.resend(email);
    if (!alive.current) return;
    if (result.ok) {
      const data: ActivationResend = result.data;
      applyTimes(data.serverTime);
      setStatus({
        state: "ready",
        serverTime: data.serverTime,
        expiresAt: data.expiresAt,
        resendAvailableAt: data.resendAvailableAt,
        resendsRemaining: data.resendsRemaining,
        remainingAttempts: OTP_MAX_ATTEMPTS,
      });
      setStep("code");
      setVerifiedCode("");
      setFeedback({ info: "Te enviamos un nuevo código. Revisa tu correo." });
    } else {
      setFeedback({ general: result.message });
      if (result.reason) await refresh();
    }
    setBusy(null);
  }, [email, applyTimes, refresh]);

  return { status, offsetMs, step, busy, feedback, session, verify, activate, resend, refresh, goBackToCode: () => setStep("code") };
}
