"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { AreaId } from "../types/area-detail.types";
import type { RadarAreaScore } from "../types/radar-profile.types";
import { projectRadarScore } from "../utils/project-radar-score";

export function SkillSimulationDialog({ areas, initialArea, onClose }: {
  areas: RadarAreaScore[]; initialArea: AreaId; onClose: () => void;
}) {
  const [areaId, setAreaId] = useState(initialArea);
  const area = areas.find(item => item.id === areaId)!;
  const [projection, setProjection] = useState(area.score);
  const result = projectRadarScore(areas, areaId, projection);
  const decimal = (value: number) => value.toLocaleString("es-BO", { maximumFractionDigits: 2 });

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto border-t-[3px] border-t-primary sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Proyecta una habilidad</DialogTitle>
        <DialogDescription>Explora cómo mejorar una competencia impactaría tu promedio. La simulación es temporal y se descarta al cerrar.</DialogDescription>
      </DialogHeader>
      <Label htmlFor="simulation-area">Competencia</Label>
      <NativeSelect id="simulation-area" value={areaId} onChange={event => {
        const next = areas.find(item => item.id === event.target.value)!;
        setAreaId(next.id); setProjection(next.score);
      }}>
        {areas.map(item => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}
      </NativeSelect>
      <p>Puntaje actual: <strong>{decimal(area.score)} / 10</strong></p>
      <Label htmlFor="simulation-score">Puntaje proyectado</Label>
      <Input id="simulation-score" type="number" min={area.score} max={10} step="0.1" value={result.score} onChange={event => setProjection(Number(event.target.value))} />
      <Input aria-label="Ajustar proyección" type="range" min={area.score} max={10} step="0.1" value={result.score} onChange={event => setProjection(Number(event.target.value))} className="w-full accent-accent" />
      <div aria-label="Comparación de puntajes" className="relative h-3 overflow-hidden rounded-full bg-border">
        <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${result.score * 10}%` }} />
        <div className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${area.score * 10}%` }} />
      </div>
      <div aria-live="polite" className="space-y-2 rounded-lg border border-border bg-surface-soft p-4">
        <p>Incremento simulado: +{decimal(result.score - area.score)}</p>
        <p>Promedio global proyectado: <strong>{decimal(result.average)} / 10</strong></p>
      </div>
      <Button type="button" variant="outline" onClick={onClose}>Cerrar simulación</Button>
    </DialogContent>
  </Dialog>;
}
