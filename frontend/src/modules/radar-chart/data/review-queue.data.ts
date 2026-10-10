import type {
  ReviewProfile,
  ReviewQueueFilter,
} from "../types/review-queue.types";

export const REVIEW_PROFILES: ReviewProfile[] = [
  {
    id: 1,
    name: "Ana Martínez",
    targetRole: "Full Stack Developer",
    submittedAt: "05/10/2026 18:20",
    globalAffinity: 8.5,
    status: "Completado",
    areas: [
      { area: "Desarrollo", level: "Experto", score: 9 },
      { area: "Cloud/DevOps", level: "Experto", score: 8.5 },
      { area: "Data/AI", level: "Experto", score: 8 },
      { area: "QA", level: "Experto", score: 8.5 },
      { area: "Ciberseguridad", level: "Experto", score: 8 },
      { area: "Gobernanza TI", level: "Experto", score: 9 },
    ],
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    targetRole: "DevOps Engineer",
    submittedAt: "05/10/2026 17:45",
    globalAffinity: 7.3,
    status: "Procesando",
    areas: [
      { area: "Desarrollo", level: "Avanzado", score: 7 },
      { area: "Cloud/DevOps", level: "Experto", score: 9 },
      { area: "Data/AI", level: "Avanzado", score: 7 },
      { area: "QA", level: "Avanzado", score: 7.5 },
      { area: "Ciberseguridad", level: "Avanzado", score: 7 },
      { area: "Gobernanza TI", level: "Intermedio", score: 6.3 },
    ],
  },
  {
    id: 3,
    name: "María López",
    targetRole: "Data Analyst",
    submittedAt: "05/10/2026 16:30",
    globalAffinity: 6.8,
    status: "Pendiente",
    areas: [
      { area: "Desarrollo", level: "Avanzado", score: 6.5 },
      { area: "Cloud/DevOps", level: "Intermedio", score: 6 },
      { area: "Data/AI", level: "Experto", score: 9 },
      { area: "QA", level: "Avanzado", score: 6.5 },
      { area: "Ciberseguridad", level: "Intermedio", score: 6 },
      { area: "Gobernanza TI", level: "Avanzado", score: 6.8 },
    ],
  },
  {
    id: 4,
    name: "Diego Fernández",
    targetRole: "QA Engineer",
    submittedAt: "05/10/2026 15:10",
    globalAffinity: 6.2,
    status: "Pendiente",
    areas: [
      { area: "Desarrollo", level: "Intermedio", score: 6 },
      { area: "Cloud/DevOps", level: "Intermedio", score: 5.5 },
      { area: "Data/AI", level: "Intermedio", score: 5.5 },
      { area: "QA", level: "Experto", score: 9 },
      { area: "Ciberseguridad", level: "Intermedio", score: 5.5 },
      { area: "Gobernanza TI", level: "Intermedio", score: 5.7 },
    ],
  },
];

export const REVIEW_QUEUE_FILTERS: ReviewQueueFilter[] = [
  "Todos",
  "Completado",
  "Procesando",
  "Pendiente",
];
