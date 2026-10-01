import type { TechnicalArea } from "../types/technical-area.types";

// Datos de prueba: se reemplazan por GET /technical-areas cuando el backend esté listo
export const MOCK_TECHNICAL_AREAS: TechnicalArea[] = [
  { id: 1, name: "Backend", description: "APIs, lógica de negocio" },
  { id: 2, name: "Desarrollo Web", description: "Frontend & SPAs" },
  { id: 3, name: "Bases de Datos", description: "SQL, NoSQL, modelado" },
  { id: 4, name: "QA", description: "Testing & calidad" },
  { id: 5, name: "Datos", description: "Pipelines, BI, Machine Learning" },
  { id: 6, name: "Cloud", description: "Infraestructura, DevOps" },
  { id: 7, name: "Redes", description: "Seguridad & comunicaciones" },
  { id: 8, name: "Arquitectura", description: "Sistemas distribuidos & diseño" },
];

// Áreas que el mentor ya tiene guardadas (Backend, Cloud y Arquitectura)
export const MOCK_MENTOR_AREA_IDS: number[] = [1, 6, 8];

// Poner en true para probar el mensaje de error
const SHOULD_SIMULATE_ERROR = false;

// Simula PUT /mentors/me/technical-areas
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveMentorAreas = (areaIds: number[]): Promise<void> =>
  new Promise((resolve, reject) =>
    setTimeout(
      () => (SHOULD_SIMULATE_ERROR ? reject(new Error("500")) : resolve()),
      800,
    ),
  );