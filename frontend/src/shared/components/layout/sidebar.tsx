"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ClipboardCheck,
  House,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { title?: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Inicio", href: "/", icon: House },
      { label: "Mi perfil", href: "/profile", icon: User },
      { label: "Empleos", href: "/jobs", icon: Briefcase },
    ],
  },
  {
    title: "Mentorías",
    items: [
      { label: "Buscar mentores", href: "/mentors/search", icon: Search },
      {
        label: "Mi participación",
        href: "/mentors/participation",
        icon: ClipboardCheck,
      },
    ],
  },
];

// Usuario de prueba: se reemplaza por la sesión real (AuthContext) cuando exista
const MOCK_CURRENT_USER = { name: "Alex Vasquez", career: "Ing. de Sistemas" };

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const isItemActive = (pathname: string, href: string) =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink text-white md:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="font-tight text-lg font-extrabold tracking-tight">
          UMSSY ALUMNI
        </p>
      </div>

      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.title ?? "main"}>
            {section.title && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-white/40">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = isItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-accent text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-semibold text-ink">
          {getInitials(MOCK_CURRENT_USER.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {MOCK_CURRENT_USER.name}
          </p>
          <p className="truncate text-xs text-white/60">
            {MOCK_CURRENT_USER.career}
          </p>
        </div>
      </div>
    </aside>
  );
}