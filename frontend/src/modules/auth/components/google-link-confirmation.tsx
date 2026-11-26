"use client";

import { BadgeCheck, CircleAlert, LoaderCircle, PartyPopper } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { GoogleIcon } from "@/shared/components/icons/google-icon";
import { useGoogleLinkConfirmation } from "../hooks/use-google-link-confirmation";
import type { GoogleLinkConfirmationProps } from "../types/google-link-confirmation-props.types";

export function GoogleLinkConfirmation({
  link,
  nextPath = null,
  onSessionStarted,
  onCancel,
  onChooseAnother,
}: GoogleLinkConfirmationProps) {
  const linking = useGoogleLinkConfirmation({ link, nextPath, onSessionStarted });
  const isExpired = linking.error?.kind === "expired";

  if (linking.status === "success") {
    return (
      <section className="w-full max-w-login-form text-center">
        <BrandLogo priority className="mx-auto mb-8 w-56" />
        <PartyPopper aria-hidden="true" className="mx-auto mb-4 size-10 text-ink" />
        <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">
          ¡Bienvenido de nuevo!
        </h1>
        <p role="status" className="mt-3 mb-8 text-base leading-relaxed text-text-secondary">
          Tu cuenta de Google quedó vinculada. La próxima vez podrás entrar con un solo clic.
        </p>
        <Button
          type="button"
          variant="institutional"
          onClick={linking.continueToHome}
          className="h-12 w-full text-base font-extrabold tracking-wide uppercase"
        >
          Ir al inicio
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="google-link-title"
      className="w-full max-w-login-form animate-in duration-300 ease-out fade-in slide-in-from-right-2"
    >
      <Link href="/" aria-label="UMSSY, volver al inicio" className="mb-8 inline-block">
        <BrandLogo priority className="w-56" />
      </Link>

      <h1 id="google-link-title" className="font-tight text-3xl font-extrabold text-ink md:text-4xl">
        Vincula tu cuenta de Google
      </h1>
      <p className="mt-3 mb-6 text-base leading-relaxed text-text-secondary">
        Encontramos tu cuenta UMSSY con este correo. Vincúlala para iniciar sesión con Google.
      </p>

      <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-surface-soft p-4">
        <GoogleIcon className="size-6 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{link.email}</p>
          {link.emailVerified ? (
            <p className="flex items-center gap-1 text-xs text-text-secondary">
              <BadgeCheck aria-hidden="true" className="size-3.5" />
              Verificado por Google
            </p>
          ) : null}
        </div>
      </div>

      {linking.error ? (
        <Alert role="alert" className="mb-4 border-danger/25 bg-surface text-danger">
          <CircleAlert aria-hidden="true" />
          <AlertDescription className="font-medium text-danger">
            {linking.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {isExpired ? (
        <Button
          type="button"
          variant="institutional"
          onClick={onChooseAnother}
          className="h-12 w-full text-base font-extrabold tracking-wide uppercase"
        >
          Iniciar con Google de nuevo
        </Button>
      ) : (
        <Button
          type="button"
          variant="institutional"
          disabled={linking.isLinking || (linking.status === "error" && !linking.canRetry)}
          onClick={() => void linking.confirm()}
          className="h-12 w-full text-base font-extrabold tracking-wide uppercase"
        >
          {linking.isLinking ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {linking.isLinking ? "Vinculando..." : "Vincular y continuar"}
        </Button>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Button type="button" variant="outline" disabled={linking.isLinking} onClick={onCancel} className="h-11 w-full">
          Cancelar
        </Button>
        {!isExpired ? (
          <Button
            type="button"
            variant="link"
            disabled={linking.isLinking}
            onClick={onChooseAnother}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Elegir otra cuenta
          </Button>
        ) : null}
      </div>
    </section>
  );
}
