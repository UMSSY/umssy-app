import type { ReactNode } from "react";

interface ProfilePageLayoutProps {
  section: string;
  children: ReactNode;
}

const BREADCRUMB = "Comunidad / Mi perfil";

// Forces the light palette of the design system even when the OS uses dark mode.
export function ProfilePageLayout({ section, children }: ProfilePageLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-1 flex-col bg-surface-soft text-ink [color-scheme:light]">
      <header className="hidden items-center justify-between gap-4 border-b border-border bg-surface px-8 py-4 md:flex">
        <div>
          <p className="text-[12.5px] font-semibold text-text-secondary">{BREADCRUMB}</p>
          <p className="font-tight text-[20px] font-bold text-ink">{section}</p>
        </div>
        <span className="shrink-0 text-[12.5px] font-semibold text-ink-soft">
          Egresado aprobado
        </span>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-10 md:px-8 md:pt-10">
        <p className="mb-2 text-[12.5px] font-semibold text-text-secondary md:hidden">
          {BREADCRUMB}
        </p>
        {children}
      </main>
    </div>
  );
}
