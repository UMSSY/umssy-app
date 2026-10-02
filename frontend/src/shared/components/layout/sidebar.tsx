"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, House, TicketCheck } from "lucide-react";

const navigationItems = [
  { href: "/events", label: "Talleres", Icon: House },
  { href: "/mis-pases", label: "Mis pases", Icon: TicketCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col bg-app-sidebar text-white md:min-h-dvh md:w-[215px]">
      <header className="px-4 pb-3 pt-4 md:pb-5">
        <Link href="/" className="flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            U
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold leading-4">UMSSY</span>
            <span className="block truncate text-[9px] leading-4 text-white/65">
              Universidad Mayor de San Simón
            </span>
          </span>
        </Link>

        <div className="mt-5 hidden items-center gap-2 rounded-md bg-app-sidebar-active px-3 py-2.5 md:flex">
          <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-gold" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold leading-4 text-gold">Titulado</p>
            <p className="truncate text-[9px] leading-3 text-white/70">
              Acceso a solicitudes
            </p>
          </div>
        </div>
      </header>

      <nav
        aria-label="Navegación principal"
        className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-1.5 md:py-0"
      >
        {navigationItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-10 shrink-0 items-center gap-2.5 rounded-md px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isActive
                  ? "bg-app-sidebar-active font-semibold text-white before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-accent"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden px-4 pb-4 pt-6 md:block">
        <p className="flex items-center gap-2 text-[10px] font-medium">
          <span className="size-1.5 rounded-full bg-app-online" />
          Conectado
        </p>
        <p className="mt-1.5 text-[9px] text-white/65">
          Datos guardados localmente
        </p>
      </div>
    </aside>
  );
}