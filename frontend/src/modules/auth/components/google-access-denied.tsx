"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { GOOGLE_NOT_REGISTERED_MESSAGE } from "../constants/google-link.constants";
import type { GoogleAccessDenied as GoogleAccessDeniedState } from "../hooks/use-google-login";

interface GoogleAccessDeniedProps {
  denied: GoogleAccessDeniedState;
  onRetryGoogle: () => void;
  onBackToLogin: () => void;
}

const ROLE_NOT_ALLOWED_MESSAGE =
  "El acceso con Google solo está permitido para estudiantes, titulados y mentores. Si eres empresa o administrativo, por favor inicia sesión con tu correo electrónico y contraseña.";

export function GoogleAccessDenied({ denied, onRetryGoogle, onBackToLogin }: GoogleAccessDeniedProps) {
  const isRoleDenied = denied.reason === "role_not_allowed";

  return (
    <div className="w-full max-w-login-form animate-in duration-300 ease-out fade-in slide-in-from-right-2">
      <Link href="/" aria-label="UMSSY, volver al inicio" className="mb-8 inline-block">
        <BrandLogo priority className="w-56" />
      </Link>
      <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">Acceso no permitido</h1>
      <p className="mt-3 mb-8 text-base leading-relaxed text-text-secondary">
        {isRoleDenied
          ? denied.message || ROLE_NOT_ALLOWED_MESSAGE
          : denied.message || GOOGLE_NOT_REGISTERED_MESSAGE}
      </p>
      {isRoleDenied ? (
        <>
          <Button
            type="button"
            variant="institutional"
            onClick={onBackToLogin}
            className="flex h-12 w-full items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase"
          >
            INICIAR SESIÓN CON CONTRASEÑA →
          </Button>
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="link"
              onClick={onRetryGoogle}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Probar con otra cuenta de Google
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="institutional"
            onClick={onRetryGoogle}
            className="flex h-12 w-full items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase"
          >
            PROBAR CON OTRA CUENTA →
          </Button>
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="link"
              onClick={onBackToLogin}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Volver a iniciar sesión
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
