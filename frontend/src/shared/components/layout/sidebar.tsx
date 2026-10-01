"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  User,
  Target,
  GraduationCap,
  UserCheck,
  Award,
  Briefcase,
  BarChart3,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

interface SubMenuItem {
  title: string;
  href: string;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "Principal",
    href: "/",
    icon: Home,
  },
  {
    title: "Comunidad",
    href: "/community",
    icon: Users,
  },
  {
    title: "Mi perfil",
    href: "/profile",
    icon: User,
  },
  {
    title: "Oportunidades",
    href: "/opportunities",
    icon: Target,
  },
  {
    title: "Talleres",
    href: "/workshops",
    icon: GraduationCap,
  },
  {
    title: "Reclutamiento",
    href: "/recruitment",
    icon: UserCheck,
  },
  {
    title: "Mentorías",
    href: "/mentorships",
    icon: Award,
  },
  {
    title: "Oferta laboral",
    href: "/job-offers",
    icon: Briefcase,
  },
  {
    title: "Reportes analíticos",
    icon: BarChart3,
    subItems: [
      {
        title: "Reporte de usuarios registrados aceptados",
        href: "/analytics/accepted-users-report",
      },
      {
        title: "Reporte de usuarios registrados rechazados",
        href: "/analytics/rejected-users-report",
      },
      {
        title: "Historial de reportes generados",
        href: "/analytics/report-history",
      },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  // El menú de Análisis permanece desplegado por defecto
  const [analysisOpen, setAnalysisOpen] = useState(true);

  return (
    <>
      {/* Backdrop oscuro para móvil (< md) cuando el menú está abierto */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Barra lateral de navegación (Fija en desktop, Drawer retráctil en móvil) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-ink text-white flex flex-col h-full border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:h-screen md:shrink-0 md:z-auto md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } select-none`}
      >
        {/* Encabezado con placeholder de logo, nombre institucional y botón de cierre móvil */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            {/* Recuadro con X indicando la posición del logotipo institucional */}
            <div
              className="w-10 h-10 rounded-lg bg-red-950/60 border border-accent/70 flex items-center justify-center shrink-0 shadow-inner"
              title="Espacio reservado para el logotipo"
            >
              <X className="w-5 h-5 text-accent stroke-[2.5]" />
            </div>

            <div className="flex flex-col">
              <span className="font-tight font-extrabold text-xl tracking-tight leading-none text-white">
                UMSSY
              </span>
            </div>
          </div>

          {/* Botón de cierre visible únicamente en móvil */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar menú de navegación"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      {/* Navegación Principal con las opciones de las épicas */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          if (item.subItems) {
            const isAnySubActive = item.subItems.some(
              (sub) =>
                pathname === sub.href ||
                (sub.href === "/analytics/accepted-users-report" &&
                  (pathname === "/analytics" || pathname === "/"))
            );

            return (
              <div key={item.title} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setAnalysisOpen(!analysisOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] font-sans transition-colors ${
                    isAnySubActive
                      ? "text-white font-medium bg-white/5"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.title}</span>
                  </div>
                  {analysisOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Submenús de Análisis */}
                {analysisOpen && (
                  <div className="pl-6 pr-1 space-y-0.5 mt-0.5">
                    {item.subItems.map((sub) => {
                      const isSubActive =
                        pathname === sub.href ||
                        (sub.href ===
                          "/analytics/accepted-users-report" &&
                          (pathname === "/analytics" || pathname === "/"));

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onClose}
                          className={`flex items-start gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] leading-snug transition-colors ${
                            isSubActive
                              ? "bg-white/10 text-white font-medium"
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                          }`}
                        >
                          {/* Indicador visual de selección */}
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              isSubActive ? "bg-accent" : "bg-slate-500"
                            }`}
                          />
                          <span className="flex-1">{sub.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href || "#"}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-sans transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 text-slate-400" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tarjeta de perfil de usuario en el pie del menú */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 transition-colors cursor-pointer border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Recuadro con X indicando el espacio para la foto de perfil */}
            <div
              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0"
              title="Espacio reservado para la foto de perfil"
            >
              <X className="w-4 h-4 text-slate-400 stroke-[2]" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium text-white truncate">
                Usuario
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                Rol
              </span>
            </div>
          </div>

          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>
    </aside>
  </>
);
}
