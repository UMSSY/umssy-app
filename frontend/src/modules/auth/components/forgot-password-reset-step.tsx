import type { FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/shared/components/password-field";
import { PasswordRequirements } from "@/shared/components/password-requirements";

interface ForgotPasswordResetStepProps {
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  passwordError: string;
  setPasswordError: (err: string) => void;
  isPending: boolean;
  onSubmit: (e: FormEvent) => void;
}

export function ForgotPasswordResetStep({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  setPasswordError,
  isPending,
  onSubmit,
}: ForgotPasswordResetStepProps) {
  return (
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

      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <PasswordField
            id="new-password"
            label="Nueva contraseña"
            toggleAriaLabel="contraseña"
            value={newPassword}
            onChange={(val) => {
              setNewPassword(val);
              if (passwordError) setPasswordError("");
            }}
            describedBy="new-password-rules"
            disabled={isPending}
          />
        </div>

        <div className="mb-4">
          <PasswordField
            id="confirm-password"
            label="Confirmar contraseña"
            toggleAriaLabel="contraseña"
            value={confirmPassword}
            onChange={(val) => {
              setConfirmPassword(val);
              if (passwordError) setPasswordError("");
            }}
            disabled={isPending}
          />
        </div>

        <PasswordRequirements password={newPassword} id="new-password-rules" />

        {passwordError ? (
          <p role="alert" className="mt-4 text-[13px] font-medium text-danger">
            {passwordError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="institutional"
          disabled={isPending || !newPassword || !confirmPassword}
          className="mt-8 h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
        >
          {isPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          {isPending ? "Guardando..." : "GUARDAR CONTRASEÑA →"}
        </Button>
      </form>
    </div>
  );
}
