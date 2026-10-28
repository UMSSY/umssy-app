"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OTP_LENGTH } from "../../constants/account-activation.constants";
import type { ActivationStatus } from "../../types/account-activation.types";
import { formatCountdown } from "../../utils/format-countdown";
import { maskEmail } from "../../utils/mask-email";
import { FieldError } from "../personal-data/field-error";
import { OtpInput } from "./otp-input";

interface ActivationCodeStepProps {
  email: string;
  status: ActivationStatus;
  expiresIn: number;
  resendIn: number;
  isBusy: boolean;
  isVerifying: boolean;
  isResending: boolean;
  error?: string | undefined;
  info?: string | undefined;
  onVerify: (code: string) => void;
  onResend: () => void;
}

export function ActivationCodeStep(props: ActivationCodeStepProps) {
  const { email, status, expiresIn, resendIn, isBusy, isVerifying, isResending, error, info, onVerify, onResend } = props;
  const [code, setCode] = useState("");
  const canSubmit = code.length === OTP_LENGTH && !isBusy;
  const canResend = resendIn === 0 && status.resendsRemaining > 0 && !isBusy;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) onVerify(code);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-md">
      <MailCheck aria-hidden="true" className="mb-4 size-9 text-accent" />
      <h1 className="font-tight text-3xl font-extrabold text-ink">Activa tu cuenta</h1>
      <p className="mt-3 mb-6 text-base text-text-secondary">
        Ingresa el código de 6 dígitos que enviamos a <strong className="text-ink">{maskEmail(email)}</strong>.
      </p>

      <OtpInput value={code} onChange={setCode} disabled={isBusy} invalid={Boolean(error)} describedBy="activation-code-error" />
      <FieldError id="activation-code-error" message={error} />
      {info ? (
        <p role="status" className="mt-2 text-sm text-accent">
          {info}
        </p>
      ) : null}

      <p className="mt-4 text-sm text-text-secondary" aria-live="polite">
        El código vence en <span className="font-semibold text-ink">{formatCountdown(expiresIn)}</span>. Te quedan{" "}
        {status.remainingAttempts} {status.remainingAttempts === 1 ? "intento" : "intentos"}.
      </p>

      <Button type="submit" variant="institutional" disabled={!canSubmit} className="mt-6 h-12 w-full text-base font-extrabold">
        {isVerifying ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isVerifying ? "Validando..." : "Continuar"}
        {!isVerifying ? <ArrowRight aria-hidden="true" /> : null}
      </Button>

      <div className="mt-6 border-t border-border pt-5 text-sm text-text-secondary">
        <p>¿No te llegó el código?</p>
        <Button type="button" variant="link" disabled={!canResend} onClick={onResend} className="h-auto p-0 text-sm font-semibold">
          {isResending ? "Reenviando..." : resendIn > 0 ? `Reenviar código en ${formatCountdown(resendIn)}` : "Reenviar código"}
        </Button>
        {status.resendsRemaining === 0 ? <p className="mt-1">Alcanzaste el límite de reenvíos por hora. Inténtalo más tarde.</p> : null}
      </div>
    </form>
  );
}
