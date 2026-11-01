import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { cn } from "cn";
import type { RequestAccessHeaderProps } from "../../types/request-access-header-props.types";

export function RequestAccessHeader({
  onLinkClick,
  appearance = "review",
}: RequestAccessHeaderProps) {
  const isOnboarding = appearance === "onboarding";

  return (
    <header
      className={
        isOnboarding
          ? "sticky top-0 z-40 flex h-app-header items-stretch justify-between gap-4 bg-ink pr-4 text-surface shadow-lg md:pr-6"
          : "flex h-app-header items-center justify-between gap-3 bg-app-header px-4 text-app-header-foreground sm:gap-6 sm:px-6"
      }
    >
      <Link
        href="/"
        aria-label="Ir al inicio de UMSSY"
        onClick={onLinkClick}
        className={
          isOnboarding
            ? "flex shrink-0 items-center bg-surface pr-12 pl-4 [clip-path:polygon(0_0,100%_0,calc(100%-2rem)_100%,0_100%)] md:pl-6"
            : "rounded-md bg-surface px-3 py-2"
        }
      >
        <BrandLogo
          className={isOnboarding ? "w-32 md:w-40" : "w-32 sm:w-40"}
          priority
        />
      </Link>

      <div
        className={
          isOnboarding
            ? "flex items-center"
            : "flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-5"
        }
      >
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm",
            isOnboarding ? "text-surface/85" : "text-app-header-foreground/85",
          )}
        >
          <span className="hidden sm:inline">¿Ya tienes cuenta?</span>

          <Link
            href="/login"
            onClick={onLinkClick}
            className={cn(
              buttonVariants({ variant: "link" }),
              "h-auto p-0 text-sm font-semibold",
              isOnboarding ? "text-surface" : "text-app-header-foreground",
            )}
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </header>
  );
}
