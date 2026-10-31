import type { FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/shared/components/otp-input";

interface ForgotPasswordVerifyStepProps {
  email: string;
  maskedEmail: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpError: string;
  setOtpError: (error: string) => void;
  countdown: number;
  formattedCountdown: string;
  resendCooldown: number;
  formattedCooldown: string;
  isResent: boolean;
  isPending: boolean;
  isResending: boolean;
  onSubmit: (e: FormEvent) => void;
  onResend: () => void;
}

export function ForgotPasswordVerifyStep({
  maskedEmail,
  otpCode,
  setOtpCode,
  otpError,
  setOtpError,
  countdown,
  formattedCountdown,
  resendCooldown,
  formattedCooldown,
  isResent,
  isPending,
  isResending,
  onSubmit,
  onResend,
}: ForgotPasswordVerifyStepProps) {
  return (
    <div>
      <div className="mb-8">
        <Link href="/" aria-label="UMSSY, volver al inicio" className="inline-block">
          <BrandLogo priority className="w-56" />
        </Link>
      </div>

      <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">Revisa tu correo</h1>
      <p className="mt-2 mb-8 text-base text-text-secondary">
        Enviamos un código de 6 dígitos a <strong className="font-semibold text-ink">{maskedEmail}</strong>. Vence en 5 minutos.
      </p>

      <form onSubmit={onSubmit} noValidate>
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
            disabled={isPending}
            invalid={Boolean(otpError)}
          />
        </div>

        {countdown > 0 ? (
          <p className="mt-2 text-sm text-text-secondary">
            El código vence en <span className="font-semibold text-ink">{formattedCountdown}</span>
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
          disabled={isPending || isResending || otpCode.length !== 6 || countdown === 0}
          className="mt-6 h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
        >
          {isPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          {isPending ? "Verificando..." : "VERIFICAR CÓDIGO →"}
        </Button>

        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="link"
            onClick={onResend}
            disabled={isPending || isResending || resendCooldown > 0}
            className="h-auto p-0 text-sm font-bold text-ink underline-offset-4 hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {isResending ? (
              <span className="flex items-center gap-1.5">
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                <span>Reenviando código...</span>
              </span>
            ) : resendCooldown > 0 ? (
              `Reenviar código en ${formattedCooldown}`
            ) : (
              "¿No te llegó? Reenviar código"
            )}
          </Button>
          {isResent ? (
            <p className="mt-2 text-sm font-semibold text-accent">
              Código reenviado a {maskedEmail}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

