"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { cn } from "cn";
import { BrandLogo } from "@/shared/components/layout/brand-logo";

export function SessionClosedView() {
  const [reason] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("reason") || params.get("code") || null;
  });

  const isRevoked = reason === "SESSION_REVOKED";
  const isRefreshInvalid = reason === "REFRESH_INVALID";
  const isPasswordChanged = reason === "PASSWORD_CHANGED";
  const isExpired = reason === "SESSION_EXPIRED" || reason === "session_expired";

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
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-login-form animate-in text-center duration-300 ease-out fade-in slide-in-from-right-2">
            <Link
              href="/"
              aria-label="UMSSY, volver al inicio"
              className="mb-8 inline-block"
            >
              <BrandLogo priority className="w-56" />
            </Link>

            <div
              data-slot="icon-badge"
              className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
            >
              <ShieldAlert className="size-7" aria-hidden="true" />
            </div>

            <h1 className="font-tight text-3xl font-extrabold text-ink sm:text-4xl">
              Tu sesión se cerró
            </h1>
            <p className="mt-3 text-sm text-text-secondary sm:text-base">
              Ya no podemos mantenerla activa. Inicia sesión de nuevo para continuar.
            </p>

            <div className="mt-6 rounded-xl border border-border/60 bg-slate-50/80 p-5 text-left dark:bg-surface">
              <p className="text-xs font-semibold text-text-secondary sm:text-sm">
                Puede deberse a que:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-text-secondary sm:text-sm">
                <li
                  className={cn(
                    "flex items-start gap-2",
                    isRevoked && "font-semibold text-ink",
                  )}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-text-secondary" />
                  <span>Cerraste sesión desde otra pestaña o dispositivo.</span>
                </li>
                <li
                  className={cn(
                    "flex items-start gap-2",
                    isRefreshInvalid && "font-semibold text-ink",
                  )}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-text-secondary" />
                  <span>No pudimos renovarla por un problema de conexión.</span>
                </li>
                <li
                  className={cn(
                    "flex items-start gap-2",
                    isPasswordChanged && "font-semibold text-ink",
                  )}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-text-secondary" />
                  <span>Cambiaste tu contraseña y por seguridad cerramos las demás sesiones.</span>
                </li>
                {isExpired ? (
                  <li className="flex items-start gap-2 font-semibold text-ink">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-text-secondary" />
                    <span>Tu sesión expiró por inactividad o superó el tiempo máximo permitido.</span>
                  </li>
                ) : null}
              </ul>
            </div>

            <Link
              href="/login"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold tracking-wider text-primary-foreground uppercase shadow-sm transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              INICIAR SESIÓN
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <p className="mt-6 text-xs text-text-secondary sm:text-sm">
              ¿No fuiste tú?{" "}
              <Link
                href="/forgot-password"
                className="font-semibold text-ink underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Cambia tu contraseña
              </Link>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-text-secondary">
          UMSSY · Universidad Mayor de San Simón
        </p>
      </div>
    </main>
  );
}

