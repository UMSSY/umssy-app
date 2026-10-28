import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { cn } from "cn";
import type { RequestAccessHeaderProps } from "../../types/request-access-header-props.types";

export function RequestAccessHeader({
  onLinkClick,
}: RequestAccessHeaderProps) {
  return (
    <header className="flex h-app-header items-center justify-between gap-3 bg-app-header px-4 text-app-header-foreground sm:gap-6 sm:px-6">
      <div className="rounded-md bg-surface px-3 py-2">
        <BrandLogo className="w-32 sm:w-40" priority />
      </div>

      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-5">
        <p className="flex items-center gap-1.5 text-sm text-app-header-foreground/85">
          <span className="hidden sm:inline">¿Ya tienes cuenta?</span>

          <Link
            href="/login"
            onClick={onLinkClick}
            className={cn(
              buttonVariants({ variant: "link" }),
              "h-auto p-0 text-sm font-semibold text-app-header-foreground",
            )}
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </header>
  );
}