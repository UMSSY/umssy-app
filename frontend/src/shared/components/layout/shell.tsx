"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu, X } from "lucide-react";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-background font-sans">
      {/* Barra superior institucional para pantallas móviles (< md) */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-ink text-white border-b border-slate-800 shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-red-950/60 border border-accent/70 flex items-center justify-center shrink-0">
              <X className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
            </div>
            <span className="font-tight font-extrabold text-base tracking-tight text-white">
              UMSSY
            </span>
          </div>
        </div>

        <span className="text-[12px] font-medium text-slate-400">
          Reportes analíticos
        </span>
      </header>

      {/* Barra lateral de navegación institucional (Fija en desktop, Drawer retráctil en móvil) */}
      <Sidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Área de contenido principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
