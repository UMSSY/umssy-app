import type { WorkExperienceItem } from "../types/work-experience-item.types";

// Registros de ejemplo hasta que existan los endpoints de experiencia laboral (#78).
export const SAMPLE_WORK_EXPERIENCES: WorkExperienceItem[] = [
  {
    id: "sample-1",
    position: "Desarrolladora web junior",
    company: "Synapse Labs",
    startDate: "2025-03",
    endDate: null,
    isCurrent: true,
    description: "Desarrollo de interfaces con React y Tailwind.",
  },
  {
    id: "sample-2",
    position: "Practicante de soporte técnico",
    company: "Universidad Mayor de San Simón",
    startDate: "2024-07",
    endDate: "2024-12",
    isCurrent: false,
    description: "Mantenimiento de equipos y atención a usuarios.",
  },
  {
    id: "sample-3",
    position: "Asistente de laboratorio",
    company: "Tecnored",
    startDate: "2023-03",
    endDate: "2024-12",
    isCurrent: false,
    description: "Apoyo en prácticas de redes.",
  },
];

