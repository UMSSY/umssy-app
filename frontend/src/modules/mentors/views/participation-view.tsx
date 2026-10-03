"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, ChevronRight, Pencil } from "lucide-react";

const KEY = "umssy-mentor-participation";
const DEFAULT_AREAS = ["Backend", "Arquitectura", "Cloud"];
const DEFAULT_ORIENTATIONS = ["Orientación técnica", "Revisión de CV"];
type State = { status: "active"; areas?: string[]; orientations?: string[] };

export function ParticipationView() {
  const [state] = useState<State | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  });
  if (!state) return <main className="min-h-full bg-surface-soft px-4 py-6 sm:py-8"><section className="mx-auto max-w-4xl rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">UMSSY · Mentorías</p><h1 className="mt-2 text-2xl font-bold text-ink">Mi participación</h1><p className="mt-2 max-w-2xl text-sm text-text-secondary">Completa el formulario para participar como mentor y elegir tus áreas técnicas y tipos de orientación.</p><Link href="/mentorship" className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white">Participa como mentor <ChevronRight size={16} /></Link></section></main>;
  const areas = state.areas?.length ? state.areas : DEFAULT_AREAS;
  const orientations = state.orientations?.length ? state.orientations : DEFAULT_ORIENTATIONS;
  return <main className="min-h-full bg-surface-soft px-4 py-6 sm:py-8"><div className="mx-auto max-w-5xl space-y-5"><div><p className="text-xs text-text-secondary">UMSSY &nbsp;›&nbsp; Mentorías &nbsp;›&nbsp; Mi participación</p><h1 className="mt-2 text-2xl font-bold text-ink">Mi participación como mentor</h1><p className="mt-1 text-sm text-text-secondary">Gestiona la información relacionada con tu participación en la red de mentorías.</p></div><section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6"><h2 className="text-base font-semibold text-ink">Estado de participación</h2><p className="mt-1 text-sm text-text-secondary">Tu perfil puede aparecer como mentor disponible en el directorio.</p><span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><Check size={13} /> Activo</span></section><section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold text-ink">Áreas técnicas</h2><Link href="/mentors/participation/technical-areas" className="inline-flex items-center gap-2 rounded-md bg-surface-soft px-3 py-2 text-xs font-semibold text-ink hover:bg-border"><Pencil size={14} /> Editar áreas técnicas</Link></div><div className="mt-4 flex flex-wrap gap-2">{areas.map((area) => <span key={area} className="rounded-md bg-surface-soft px-3 py-1.5 text-xs text-ink">{area}</span>)}</div></section><section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold text-ink">Tipos de orientación</h2></div><div className="mt-4 flex flex-wrap gap-2">{orientations.map((orientation) => <span key={orientation} className="rounded-md bg-surface-soft px-3 py-1.5 text-xs text-ink">{orientation}</span>)}</div></section></div></main>;
}

