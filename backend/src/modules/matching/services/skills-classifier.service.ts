import { Injectable } from '@nestjs/common';
import type { DetectedSkillResponse } from '../types/matching.types.js';
import { NlpService } from './nlp.service.js';

@Injectable()
export class SkillsClassifierService {
  constructor(private readonly nlpService: NlpService) {}

  // Compara los candidatos del texto contra el catalogo de habilidades (T1.6).
  // Los candidatos ya vienen normalizados por el pipeline (minusculas, sin signos);
  // las habilidades de varias palabras llegan unidas con guion bajo (ej. machine_learning).
  // Devuelve cada habilidad una sola vez, en el orden en que aparece en el texto.
  classify(candidates: string[], catalog: DetectedSkillResponse[]): DetectedSkillResponse[] {
    const catalogByKey = this.buildCatalogIndex(catalog);
    const detected = new Map<string, DetectedSkillResponse>();

    for (const candidate of candidates) {
      const skill = catalogByKey.get(candidate.trim().toLowerCase());
      if (skill !== undefined && !detected.has(skill.id)) {
        detected.set(skill.id, skill);
      }
    }

    return [...detected.values()];
  }

  // Normaliza los nombres del catalogo igual que el texto, para comparar sin distinguir
  // mayusculas (AC-01.10): "Node.js" -> nodejs, "Machine Learning" -> machine_learning.
  private buildCatalogIndex(catalog: DetectedSkillResponse[]): Map<string, DetectedSkillResponse> {
    const skillsByKey = new Map<string, DetectedSkillResponse[]>();

    for (const skill of catalog) {
      const key = this.nlpService.normalizeText(skill.name).replace(/ /g, '_');
      if (key.length === 0) continue;
      skillsByKey.set(key, [...(skillsByKey.get(key) ?? []), skill]);
    }

    const index = new Map<string, DetectedSkillResponse>();
    for (const [key, skills] of skillsByKey) {
      const skill = this.resolveCollision(key, skills);
      if (skill !== undefined) index.set(key, skill);
    }
    return index;
  }

  // La limpieza de caracteres especiales puede volver iguales a varias habilidades
  // ("C", "C++" y "C#" quedan como "c"). Se conserva solo la que se escribe igual que
  // la clave; si ninguna lo hace, la clave es ambigua y se descarta para no dar falsos positivos.
  private resolveCollision(
    key: string,
    skills: DetectedSkillResponse[],
  ): DetectedSkillResponse | undefined {
    if (skills.length === 1) return skills[0];

    const exact = skills.filter(
      (skill) => skill.name.trim().toLowerCase().replace(/ /g, '_') === key,
    );
    return exact.length === 1 ? exact[0] : undefined;
  }
}
