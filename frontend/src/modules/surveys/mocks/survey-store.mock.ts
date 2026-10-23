import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/shared/services/storage/browser-local-storage";
import type { SurveyTables } from "../types/survey-records.types";
import { buildSurveySeed } from "./survey-seed.mock";

// TODO: eliminar cuando existan las tablas de encuestas en el backend.
// Base de datos de ejemplo: las tablas viven en memoria y se guardan en localStorage
// para que lo creado sobreviva a recargar la página.
const SURVEY_STORE_STORAGE_KEY = "umssy.surveys.mock-db.v2";

let tables: SurveyTables | null = null;

function loadTables(): SurveyTables {
  const stored = readLocalStorage(SURVEY_STORE_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as SurveyTables;
    } catch {
      removeLocalStorage(SURVEY_STORE_STORAGE_KEY);
    }
  }
  return buildSurveySeed();
}

export function readSurveyTables(): SurveyTables {
  tables ??= loadTables();
  return tables;
}

export function writeSurveyTables(nextTables: SurveyTables): void {
  tables = nextTables;
  writeLocalStorage(SURVEY_STORE_STORAGE_KEY, JSON.stringify(nextTables));
}

// Vuelve a los datos iniciales de ejemplo (útil para QA y para los tests).
export function resetSurveyTables(): void {
  tables = null;
  removeLocalStorage(SURVEY_STORE_STORAGE_KEY);
}
