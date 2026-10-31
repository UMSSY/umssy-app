"use client";

import { useState, useEffect, type FormEvent } from "react";
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

const INITIAL_COUNTDOWN_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 120;
const TRANSITION_DURATION_MS = 200;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function ForgotPasswordView() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>("request");
  const [isExiting, setIsExiting] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResent, setIsResent] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const requestHook = useRequestPasswordReset();
  const resendHook = useRequestPasswordReset();
  const verifyHook = useVerifyPasswordReset();
  const resetHook = useResetPassword();

  function goToStep(nextStep: ForgotPasswordStep, direction: "forward" | "backward" = "forward") {
    setTransitionDirection(direction);
    setIsExiting(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsExiting(false);
    }, TRANSITION_DURATION_MS);
  }

  useEffect(() => {
    if (step !== "verify" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (step !== "verify" || resendCooldown <= 0) return;

    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [step, resendCooldown]);

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim();
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
    const res = await requestHook.requestResetCode({ email: trimmedEmail });
    if (res.ok) {
      setCountdown(INITIAL_COUNTDOWN_SECONDS);
      setResendCooldown(0);
      setOtpCode("");
      setOtpError("");
      setIsResent(false);
      goToStep("verify", "forward");
    } else {
      setEmailError(res.error);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (otpCode.length < 6) {
      setOtpError("Ingresa el código completo de 6 dígitos");
      return;
    }
    if (countdown === 0) {
      setOtpError("El código ha expirado. Por favor, solicita uno nuevo.");
      return;
    }

    setOtpError("");
    const res = await verifyHook.verifyResetCode({ email: email.trim(), code: otpCode });
    if (res.ok) {
      setPasswordError("");
      setNewPassword("");
      setConfirmPassword("");
      goToStep("reset", "forward");
    } else {
      setOtpError(res.error);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendHook.isLoading) return;
    const res = await resendHook.requestResetCode({ email: email.trim() });
    if (res.ok) {
      setCountdown(INITIAL_COUNTDOWN_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpCode("");
      setOtpError("");
      setIsResent(true);
    } else {
      setOtpError(res.error);
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();

    if (getPasswordRules(newPassword).some((rule) => !rule.met)) {
      setPasswordError("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setPasswordError("");
    const res = await resetHook.resetPassword({
      email: email.trim(),
      code: otpCode,
      password: newPassword,
    });
    if (res.ok) {
      goToStep("success", "forward");
    } else {
      setPasswordError(res.error);
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

      <div className="flex min-h-dvh flex-col px-8 py-9 lg:px-10 xl:px-12">
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
              onClick={() => {
                goToStep("request", "backward");
                setOtpError("");
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
                isPending={requestHook.isLoading}
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
                formattedCountdown={formatTime(countdown)}
                resendCooldown={resendCooldown}
                formattedCooldown={formatTime(resendCooldown)}
                isResent={isResent}
                isPending={verifyHook.isLoading}
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
                isPending={resetHook.isLoading}
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
