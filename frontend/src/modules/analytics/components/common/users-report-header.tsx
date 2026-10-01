import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function UsersReportHeader() {
  return (
    <div className="space-y-1">
      {/* Migas de pan (Breadcrumbs) */}
      <nav className="flex items-center gap-1.5 text-[12px] text-text-secondary font-sans flex-wrap">
        <Link href="/" className="hover:text-ink transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="hover:text-ink transition-colors cursor-pointer">
          Reportes Analíticos
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-semibold text-ink">
          Reporte de usuarios registrados aceptados
        </span>
      </nav>

      {/* Título principal H1 */}
      <h1 className="font-tight font-extrabold text-[22px] sm:text-[28px] md:text-[30px] text-ink tracking-tight pt-1 leading-tight">
        Reporte de usuarios registrados aceptados
      </h1>
    </div>
  );
}
