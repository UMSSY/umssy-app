"use client";

import { useRef, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { maskEmail } from "@/shared/utils/mask-email";
import { getPasswordRules } from "@/shared/utils/password-rules";
import type { ForgotPasswordStep } from "../types/forgot-password.types";
import { ForgotPasswordRequestStep } from "../components/forgot-password-request-step";
import { ForgotPasswordVerifyStep } from "../components/forgot-password-verify-step";
import { ForgotPasswordResetStep } from "../components/forgot-password-reset-step";
import { ForgotPasswordSuccessStep } from "../components/forgot-password-success-step";
import { useRequestPasswordReset } from "../hooks/use-request-password-reset";
import { useVerifyPasswordReset } from "../hooks/use-verify-password-reset";
import { useResetPassword } from "../hooks/use-reset-password";

import { useCredentialRestrictions } from "../hooks/use-credential-restrictions";
import { formatRemainingTime } from "../utils/format-remaining-time";
import {
  PASSWORD_RECOVERY_CODE_SECONDS,
  PASSWORD_RECOVERY_RESEND_SECONDS,
  PASSWORD_RECOVERY_TRANSITION_MS,
  PASSWORD_RECOVERY_COOLDOWN_MESSAGE,
} from "../constants/password-recovery.constants";

export function ForgotPasswordView() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>("request");
  const [isExiting, setIsExiting] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(PASSWORD_RECOVERY_CODE_SECONDS);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [resendError, setResendError] = useState("");
  const inFlight = useRef(false);
  const restrictions = useCredentialRestrictions();
  const [isResent, setIsResent] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const requestHook = useRequestPasswordReset();
  const resendHook = useRequestPasswordReset();
  const verifyHook = useVerifyPasswordReset();
  const resetHook = useResetPassword();
  const requestRestriction = restrictions.getRestriction("request", email);
  const verificationRestriction = restrictions.getRestriction("verify", email);
  const confirmationRestriction = verificationRestriction ?? restrictions.getRestriction("reset", email);
  const resendCooldown = requestRestriction?.remainingSeconds ?? 0;

  async function runOperation<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (inFlight.current || isExiting) return undefined;
    inFlight.current = true;
    try {
      return await action();
    } finally {
      inFlight.current = false;
    }
  }

  function startCodeCountdown() {
    const now = Date.now();
    setCodeExpiresAt(now + PASSWORD_RECOVERY_CODE_SECONDS * 1000);
    setCountdown(PASSWORD_RECOVERY_CODE_SECONDS);
    restrictions.restrict(email, {
      code: "PASSWORD_RESET_COOLDOWN",
      operation: "request",
      retryAt: now + PASSWORD_RECOVERY_RESEND_SECONDS * 1000,
      retryAfterSeconds: PASSWORD_RECOVERY_RESEND_SECONDS,
    }, PASSWORD_RECOVERY_COOLDOWN_MESSAGE);
  }

  function goToStep(nextStep: ForgotPasswordStep, direction: "forward" | "backward" = "forward") {
    setTransitionDirection(direction);
    setIsExiting(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsExiting(false);
    }, PASSWORD_RECOVERY_TRANSITION_MS);
  }

  useEffect(() => {
    if (step !== "verify" || codeExpiresAt === null) return;
    const refreshCountdown = () => {
      const remaining = Math.max(0, Math.ceil((codeExpiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) window.clearInterval(timer);
    };
    const timer = window.setInterval(refreshCountdown, 1000);
    window.addEventListener("focus", refreshCountdown);
    document.addEventListener("visibilitychange", refreshCountdown);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshCountdown);
      document.removeEventListener("visibilitychange", refreshCountdown);
    };
  }, [step, codeExpiresAt]);

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (restrictions.isBlocked("request", trimmedEmail)) return;
    if (!trimmedEmail) {
      setEmailError("Ingresa tu correo electrónico");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Ingresa un correo electrónico válido");
      return;
    }

    setEmailError("");
    const res = await runOperation(() => requestHook.requestResetCode({ email: trimmedEmail }));
    if (!res) return;
    if (res.ok) {
      startCodeCountdown();
      setResendError("");
      setOtpCode("");
      setOtpError("");
      setIsResent(false);
      goToStep("verify", "forward");
    } else {
      if (!restrictions.restrict(trimmedEmail, res.restriction, res.error)) setEmailError(res.error);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (restrictions.isBlocked("verify", email)) return;
    if (otpCode.length < 6) {
      setOtpError("Ingresa el código completo de 6 dígitos");
      return;
    }
    if (countdown === 0) {
      setOtpError("El código ha expirado. Por favor, solicita uno nuevo.");
      return;
    }

    setOtpError("");
    const res = await runOperation(() => verifyHook.verifyResetCode({ email: email.trim(), code: otpCode }));
    if (!res) return;
    if (res.ok) {
      setPasswordError("");
      setNewPassword("");
      setConfirmPassword("");
      goToStep("reset", "forward");
    } else {
      if (!restrictions.restrict(email, res.restriction, res.error)) setOtpError(res.error);
    }
  }

  async function handleResend() {
    if (restrictions.isBlocked("request", email)) return;
    setResendError("");
    const res = await runOperation(() => resendHook.requestResetCode({ email: email.trim() }));
    if (!res) return;
    if (res.ok) {
      startCodeCountdown();
      setOtpCode("");
      setOtpError("");
      setIsResent(true);
    } else {
      setIsResent(false);
      if (!restrictions.restrict(email, res.restriction, res.error)) setResendError(res.error);
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    if (restrictions.isBlocked("reset", email) || restrictions.isBlocked("verify", email)) return;

    if (getPasswordRules(newPassword).some((rule) => !rule.met)) {
      setPasswordError("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setPasswordError("");
    const res = await runOperation(() => resetHook.resetPassword({
      email: email.trim(),
      code: otpCode,
      password: newPassword,
    }));
    if (!res) return;
    if (res.ok) {
      goToStep("success", "forward");
    } else {
      if (!restrictions.restrict(email, res.restriction, res.error)) setPasswordError(res.error);
    }
  }

  return (
    <main className="grid min-h-dvh bg-surface lg:grid-cols-(--grid-template-columns-login)">
      <aside className="relative hidden lg:block">
        <Image
          src="/images/campus-fcyt.webp"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
      </aside>

      <div className="flex min-h-dvh flex-col px-4 py-5 sm:px-8 sm:py-9 lg:px-10 xl:px-12">
        <div className="mb-2 flex h-8 items-center transition-opacity duration-200">
          {step === "request" && (
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-accent hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver a iniciar sesión
            </Link>
          )}

          {step === "verify" && (
            <Button
              type="button"
              variant="link"
              disabled={verifyHook.isLoading || resendHook.isLoading || isExiting}
              onClick={() => {
                goToStep("request", "backward");
                setOtpError("");
                setOtpCode("");
                setEmailError("");
                setResendError("");
              }}
              className="flex h-auto items-center gap-2 p-0 text-sm font-medium text-accent hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Cambiar correo
            </Button>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div
            key={step}
            className={cn(
              "w-full max-w-login-form transition-all duration-200 ease-in-out",
              isExiting
                ? transitionDirection === "forward"
                  ? "-translate-x-4 scale-[0.99] opacity-0"
                  : "translate-x-4 scale-[0.99] opacity-0"
                : "translate-x-0 scale-100 animate-in opacity-100 duration-300 ease-out fade-in",
              !isExiting && (transitionDirection === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4")
            )}
          >
            {step === "request" && (
              <ForgotPasswordRequestStep
                email={email}
                setEmail={setEmail}
                emailError={emailError}
                setEmailError={setEmailError}
                onSubmit={handleRequestCode}
                restriction={requestRestriction}
                isPending={requestHook.isLoading || isExiting}
              />
            )}

            {step === "verify" && (
              <ForgotPasswordVerifyStep
                email={email}
                maskedEmail={maskEmail(email)}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                otpError={otpError}
                setOtpError={setOtpError}
                countdown={countdown}
                formattedCountdown={formatRemainingTime(countdown)}
                resendCooldown={resendCooldown}
                formattedCooldown={formatRemainingTime(resendCooldown)}
                verificationRestriction={verificationRestriction}
                requestRestriction={requestRestriction}
                resendError={resendError}
                isResent={isResent}
                isPending={verifyHook.isLoading || isExiting}
                isResending={resendHook.isLoading}
                onSubmit={handleVerifyCode}
                onResend={handleResend}
              />
            )}

            {step === "reset" && (
              <ForgotPasswordResetStep
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                passwordError={passwordError}
                setPasswordError={setPasswordError}
                restriction={confirmationRestriction}
                isPending={resetHook.isLoading || isExiting}
                onSubmit={handleResetPassword}
              />
            )}

            {step === "success" && (
              <ForgotPasswordSuccessStep onGoToLogin={() => router.push("/login")} />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary">UMSSY · Universidad Mayor de San Simón</p>
      </div>
    </main>
  );
}
