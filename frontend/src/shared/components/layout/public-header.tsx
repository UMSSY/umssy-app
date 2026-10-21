import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { buttonVariants } from "@/components/ui/button";

const NAV_LINK_CLASS_NAME = "rounded-md px-3 py-2 transition-colors hover:bg-interaction hover:text-accent focus-visible:bg-interaction focus-visible:text-accent focus-visible:outline-none";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-28 max-w-[1440px] items-center justify-between gap-6 px-8 py-4">
        <Link href="/" aria-label="UMSSY, volver al inicio" className="shrink-0"><BrandLogo priority className="w-64" /></Link>
        <nav aria-label="Navegación pública" className="flex items-center gap-2 text-sm font-medium text-ink">
          <Link className={NAV_LINK_CLASS_NAME} href="/workshops">Talleres</Link>
          <Link className={NAV_LINK_CLASS_NAME} href="/#community">La comunidad</Link>
          <Link className={NAV_LINK_CLASS_NAME} href="/#how-it-works">Cómo funciona</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>Iniciar sesión</Link>
          <Link href="/request-access" className={buttonVariants()}>Solicitar acceso</Link>
        </div>
      </div>
    </header>
  );
}
