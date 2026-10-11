/**
 * Tipos del módulo Matching (HU3 — Matriz de Compatibilidad y Análisis de Brechas).
 *
 * Los 6 ejes del Radar de Afinidad son compartidos con la EPIC "Radar Chart" (HU1/HU2/HU4).
 * Mientras esa EPIC no esté integrada en esta rama, este módulo mantiene su propia copia
 * de tipos y mock data para no acoplarse a código que todavía no existe aquí.
 */

export type AffinityAxisId =
  | "desarrollo"
  | "cloud-devops"
  | "data-ai"
  | "qa"
  | "ciberseguridad"
  | "gobernanza-ti";

export interface AffinityAxis {
  id: AffinityAxisId;
  label: string;
}

/** Puntaje 0-10 por cada uno de los 6 ejes. */
export type AxisScores = Record<AffinityAxisId, number>;

export interface Candidate {
  id: string;
  name: string;
  role: string;
  technologies: string[];
  scores: AxisScores;
}

export interface Vacancy {
  id: string;
  title: string;
  /** Perfil objetivo de la vacante: puntaje 0-10 esperado por cada eje. */
  targetProfile: AxisScores;
}

export type CandidateStatus = "active" | "discarded";

export interface CandidateWithMatch extends Candidate {
  /** % de afinidad del candidato frente al perfil objetivo de la vacante seleccionada. */
  matchPercent: number;
  /** candidato - objetivo, por eje. Negativo = brecha, positivo = fortaleza. */
  gaps: AxisScores;
  status: CandidateStatus;
}

export type MatchingAction = "contact" | "schedule" | "discard" | null;
