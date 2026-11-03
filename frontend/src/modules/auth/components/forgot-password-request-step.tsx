import type { FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle, Mail } from "lucide-react";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ForgotPasswordRequestStepProps {
  email: string;
  setEmail: (email: string) => void;
  emailError: string;
  setEmailError: (error: string) => void;
  onSubmit: (e: FormEvent) => void;
  isPending: boolean;
}

export function ForgotPasswordRequestStep({
  email,
  setEmail,
  emailError,
  setEmailError,
  onSubmit,
  isPending,
}: ForgotPasswordRequestStepProps) {
  return (
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

      <form onSubmit={onSubmit} noValidate>
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
          disabled={isPending}
          className="h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
        >
          {isPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          {isPending ? "Enviando..." : "ENVIAR CÓDIGO →"}
        </Button>
      </form>
    </div>
  );
}

