"use client";

import { Button } from "@/components/ui/button";
import { useRadarSourceNames } from "../hooks/use-radar-source-names";
import type { RadarSkillSourcesProps } from "../types/radar-skill-sources-props.types";

export function RadarSkillSources({ userId, skills }: RadarSkillSourcesProps) {
  const sources = useRadarSourceNames(userId, skills);
  if (!skills.length) return null;
  return (
    <div className="mt-4 min-w-0 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Origen de las habilidades aprobadas</h3>
      <ul className="mt-2 space-y-2 text-sm" aria-label="Fuentes de las habilidades">
        {skills.map(skill => (
          <li key={skill.id} className="break-words">
            <span className="font-medium">{skill.name}</span>
            <ul className="pl-4 text-text-secondary">
              {skill.evidenceRefs.length ? [...new Map(skill.evidenceRefs.map(ref => [`${ref.type}:${ref.id}`, ref])).entries()].map(([key, ref]) => (
                <li key={key}>{sources.getName(ref)}</li>
              )) : <li>Sin documento de origen asociado</li>}
            </ul>
          </li>
        ))}
      </ul>
      {sources.hasError ? <div role="alert" className="mt-2 text-sm">
        <p>No se pudieron consultar algunos nombres de documentos. Tus puntuaciones se conservan.</p>
        <Button type="button" variant="outline" size="sm" onClick={sources.retry}>Reintentar documentos</Button>
      </div> : null}
    </div>
  );
}
