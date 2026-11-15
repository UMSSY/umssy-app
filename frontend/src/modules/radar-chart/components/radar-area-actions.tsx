"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { RadarAreaScore } from "../types/radar-profile.types";

export function RadarAreaActions({ area, onSimulate }: { area: RadarAreaScore; onSimulate: () => void }) {
  return <section aria-label="Competencia seleccionada" className="my-4 space-y-3 rounded-lg border border-border bg-surface-soft p-4">
    <h3 className="font-semibold text-ink">{area.name}</h3>
    <p className="text-sm">Puntaje actual: {area.score.toLocaleString("es-BO")} / 10</p>
    <Button type="button" variant="outline" className="w-full" onClick={onSimulate}>Simular habilidad</Button>
    <Link className="block text-sm font-semibold text-accent underline" href={`/mentorship/mentors?radarArea=${area.id}`}>Ver mentores de esta área</Link>
  </section>;
}
