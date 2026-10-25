"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import { OtpInput } from "../components/otp-input";
import { authService } from "../services/auth.service";
import type { ForgotPasswordStep } from "../types/forgot-password.types";

const INITIAL_COUNTDOWN_SECONDS = 300; // 5 minutos
const RESEND_COOLDOWN_SECONDS = 120; // 2 minutos
const TRANSITION_DURATION_MS = 200;

function maskEmail(rawEmail: string): string {
  const trimmed = rawEmail.trim();
  const [local = "", domain = ""] = trimmed.split("@");
  if (!local) return trimmed;
  const firstChar = local.charAt(0);
  const asterisks = "*".repeat(Math.max(local.length - 1, 4));
  return domain ? `${firstChar}${asterisks}@${domain}` : `${firstChar}${asterisks}`;
}

export function ForgotPasswordView() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>("request");
  const [isExiting, setIsExiting] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Request
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Step 2: Verify OTP
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResent, setIsResent] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Step 3: Reset Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Validation criteria for Step 3
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  // Smooth transition helper
  function goToStep(nextStep: ForgotPasswordStep, direction: "forward" | "backward" = "forward") {
    setTransitionDirection(direction);
    setIsExiting(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsExiting(false);
    }, TRANSITION_DURATION_MS);
  }

  // Expiration timer logic for Step 2 (10 minutes)
  useEffect(() => {
    if (step !== "verify" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  // Resend cooldown timer logic (2 minutes)
  useEffect(() => {
    if (step !== "verify" || resendCooldown <= 0) return;

    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [step, resendCooldown]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Handle Step 1 submit
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
    setIsLoading(true);
    try {
      await authService.requestPasswordResetCode({ email: trimmedEmail });
      setCountdown(INITIAL_COUNTDOWN_SECONDS);
      setResendCooldown(0);
      setOtpCode("");
      setOtpError("");
      setIsResent(false);
      goToStep("verify", "forward");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Error al solicitar el código");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Step 2 submit
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
    setIsLoading(true);
    try {
      await authService.verifyPasswordResetCode({ email: email.trim(), code: otpCode });
      setPasswordError("");
      setNewPassword("");
      setConfirmPassword("");
      goToStep("reset", "forward");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Código de verificación inválido");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle resend code in Step 2 with 2-minute cooldown
  async function handleResend() {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await authService.requestPasswordResetCode({ email: email.trim() });
      setCountdown(INITIAL_COUNTDOWN_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpCode("");
      setOtpError("");
      setIsResent(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "No se pudo reenviar el código");
    } finally {
      setIsResending(false);
    }
  }

  // Handle Step 3 submit
  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    if (!hasMinLength || !hasUpperCase || !hasNumber) {
      setPasswordError("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setPasswordError("");
    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        code: otpCode,
        password: newPassword,
      });
      goToStep("success", "forward");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-surface lg:grid-cols-(--grid-template-columns-login)">
      {/* Columna lateral con imagen del campus (persistente durante todas las pestañas) */}
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

      {/* Contenedor del formulario */}
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
              <div>
                <div className="mb-8">
                  <Link href="/" aria-label="UMSSY, volver al inicio" className="inline-block">
                    <BrandLogo priority className="w-56" />
                  </Link>
                </div>

                <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">Recupera tu contraseña</h1>
                <p className="mt-2 mb-8 text-base text-text-secondary">
                  Ingresa el correo con el que te registraste y te enviaremos un código de verificación.
                </p>

                <form onSubmit={handleRequestCode} noValidate>
                  <div className="mb-6">
                    <Label htmlFor="reset-email" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-4 left-4 size-5 text-accent" aria-hidden="true" />
                      <Input
                        id="reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        aria-invalid={emailError ? true : undefined}
                        aria-describedby={emailError ? "reset-email-hint reset-email-error" : "reset-email-hint"}
                        className="h-13 rounded-lg border-border-strong bg-surface px-12 text-base text-ink focus-visible:border-accent focus-visible:ring-accent/15 md:text-base"
                        placeholder="nombre@ejemplo.com"
                      />
                    </div>
                    <p id="reset-email-hint" className="mt-2 text-xs text-text-secondary">
                      Usa el correo con el que solicitaste acceso.
                    </p>
                    {emailError ? (
                      <p id="reset-email-error" role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
                        {emailError}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    variant="institutional"
                    disabled={isLoading}
                    className="h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
                  >
                    {isLoading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
                    {isLoading ? "Enviando..." : "ENVIAR CÓDIGO →"}
                  </Button>
                </form>
              </div>
            )}

            {step === "verify" && (
              <div>
                <div className="mb-8">
                  <Link href="/" aria-label="UMSSY, volver al inicio" className="inline-block">
                    <BrandLogo priority className="w-56" />
                  </Link>
                </div>

                <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">Revisa tu correo</h1>
                <p className="mt-2 mb-8 text-base text-text-secondary">
                  Enviamos un código de 6 dígitos a <strong className="font-semibold text-ink">{maskEmail(email)}</strong>. Vence en 5 minutos.
                </p>

                <form onSubmit={handleVerifyCode} noValidate>
                  <div className="mb-4">
                    <Label htmlFor="otp-input" className="mb-2 block text-sm font-bold text-ink">
                      Código de verificación
                    </Label>
                    <OtpInput
                      id="otp-input"
                      value={otpCode}
                      onChange={(val) => {
                        setOtpCode(val);
                        if (otpError) setOtpError("");
                      }}
                      disabled={isLoading}
                      isInvalid={Boolean(otpError)}
                    />
                  </div>

                  {countdown > 0 ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      El código vence en <span className="font-semibold text-ink">{formatTime(countdown)}</span>
                    </p>
                  ) : (
                    <p role="alert" className="mt-2 text-sm font-medium text-danger">
                      El código ha expirado. Por favor, solicita uno nuevo.
                    </p>
                  )}

                  {otpError ? (
                    <p role="alert" className="mt-2 text-[13px] font-medium text-danger">
                      {otpError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    variant="institutional"
                    disabled={isLoading || isResending || otpCode.length !== 6 || countdown === 0}
                    className="mt-6 h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
                  >
                    {isLoading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
                    {isLoading ? "Verificando..." : "VERIFICAR CÓDIGO →"}
                  </Button>

                  <div className="mt-6 text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResend}
                      disabled={isLoading || isResending || resendCooldown > 0}
                      className="h-auto p-0 text-sm font-bold text-ink underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                    >
                      {isResending ? (
                        <span className="flex items-center gap-1.5">
                          <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                          <span>Reenviando código...</span>
                        </span>
                      ) : resendCooldown > 0 ? (
                        `Reenviar código en ${formatTime(resendCooldown)}`
                      ) : (
                        "¿No te llegó? Reenviar código"
                      )}
                    </Button>
                    {isResent ? (
                      <p className="mt-2 text-sm font-semibold text-accent">
                        Código reenviado a {maskEmail(email)}
                      </p>
                    ) : null}
                  </div>
                </form>
              </div>
            )}

            {step === "reset" && (
              <div>
                <div className="mb-8">
                  <Link href="/" aria-label="UMSSY, volver al inicio" className="inline-block">
                    <BrandLogo priority className="w-56" />
                  </Link>
                </div>

                <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">Crea una nueva contraseña</h1>
                <p className="mt-2 mb-8 text-base text-text-secondary">
                  Elige una contraseña segura que no hayas usado antes.
                </p>

                <form onSubmit={handleResetPassword} noValidate>
                  <div className="mb-4">
                    <Label htmlFor="new-password" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
                      Nueva contraseña
                    </Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute top-4 left-4 size-5 text-accent" aria-hidden="true" />
                      <Input
                        id="new-password"
                        type={isNewPasswordVisible ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordError) setPasswordError("");
                        }}
                        aria-describedby="new-password-rules"
                        className="h-13 rounded-lg border-border-strong bg-surface px-12 text-base text-ink focus-visible:border-accent focus-visible:ring-accent/15 md:text-base"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={isNewPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={isNewPasswordVisible}
                        onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                        className="absolute top-1.5 right-1.5"
                      >
                        {isNewPasswordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="confirm-password" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
                      Confirmar contraseña
                    </Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute top-4 left-4 size-5 text-accent" aria-hidden="true" />
                      <Input
                        id="confirm-password"
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordError) setPasswordError("");
                        }}
                        className="h-13 rounded-lg border-border-strong bg-surface px-12 text-base text-ink focus-visible:border-accent focus-visible:ring-accent/15 md:text-base"
                        placeholder="Repite tu contraseña"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={isConfirmPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={isConfirmPasswordVisible}
                        onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        className="absolute top-1.5 right-1.5"
                      >
                        {isConfirmPasswordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </Button>
                    </div>
                  </div>

                  <ul id="new-password-rules" className="mb-6 space-y-1.5 text-xs text-text-secondary">
                    <li className={cn("flex items-center gap-2", hasMinLength ? "font-medium text-accent" : "text-text-secondary")}>
                      {hasMinLength ? (
                        <Check className="size-3.5 text-accent" aria-hidden="true" />
                      ) : (
                        <span className="inline-block size-3.5 text-center text-text-secondary" aria-hidden="true">○</span>
                      )}
                      <span>Mínimo 8 caracteres</span>
                    </li>
                    <li className={cn("flex items-center gap-2", hasUpperCase ? "font-medium text-accent" : "text-text-secondary")}>
                      {hasUpperCase ? (
                        <Check className="size-3.5 text-accent" aria-hidden="true" />
                      ) : (
                        <span className="inline-block size-3.5 text-center text-text-secondary" aria-hidden="true">○</span>
                      )}
                      <span>Al menos una letra mayúscula</span>
                    </li>
                    <li className={cn("flex items-center gap-2", hasNumber ? "font-medium text-accent" : "text-text-secondary")}>
                      {hasNumber ? (
                        <Check className="size-3.5 text-accent" aria-hidden="true" />
                      ) : (
                        <span className="inline-block size-3.5 text-center text-text-secondary" aria-hidden="true">○</span>
                      )}
                      <span>Al menos un número</span>
                    </li>
                  </ul>

                  {passwordError ? (
                    <p role="alert" className="mb-4 text-[13px] font-medium text-danger">
                      {passwordError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    variant="institutional"
                    disabled={isLoading || !hasMinLength || !hasUpperCase || !hasNumber || !confirmPassword}
                    className="h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
                  >
                    {isLoading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
                    {isLoading ? "Guardando..." : "GUARDAR CONTRASEÑA →"}
                  </Button>
                </form>
              </div>
            )}

            {step === "success" && (
              <div className="text-center">
                <div className="mb-8 flex justify-center">
                  <BrandLogo priority className="w-56" />
                </div>

                <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">¡Contraseña actualizada!</h1>
                <p className="mt-2 mb-8 text-base text-text-secondary">
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>

                <Button
                  type="button"
                  variant="institutional"
                  onClick={() => router.push("/login")}
                  className="h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
                >
                  IR A INICIAR SESIÓN →
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary">UMSSY · Universidad Mayor de San Simón</p>
      </div>
    </main>
  );
}
