import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-8 py-6 text-xs text-text-secondary">
        <p>UMSSY · Universidad Mayor de San Simón</p>
        <div className="flex gap-6"><Link href="/workshops" className="hover:text-ink">Talleres</Link><Link href="/login" className="hover:text-ink">Iniciar sesión</Link></div>
      </div>
    </footer>
  );
}
