import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { Sidebar } from "./sidebar";

type ShellProps = { children: ReactNode };

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen bg-surface-soft">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-8">
          <span className="text-sm text-text-secondary">
            Comunidad de Egresados UMSS
          </span>
          <Bell size={18} aria-label="Notificaciones" className="text-ink-soft" />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}