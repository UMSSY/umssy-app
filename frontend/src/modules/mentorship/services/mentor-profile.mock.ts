import type { MentorProfile } from "../types/mentor-profile.types";

export const mentorsMock: MentorProfile[] = [
  {
    id: 1,
    name: "Ana Rojas",
    specialty: "Arquitecta de Software",
    professionalInterests: [
      "Arquitectura de software",
      "Cloud Computing",
      "Sistemas distribuidos",
    ],
    position: "Senior Software Architect & Tech Lead",
    company: "Globant / Soluciones Cloud",
    yearsExperience: 8,
    faculty: "Facultad de Ciencias y Tecnología",
    program: "Lic. en Ingeniería de Sistemas",
    description:
      "Arquitecta de software con más de 8 años de trayectoria en diseño de sistemas distribuidos y modernización de infraestructura en la nube. Apasionada por compartir buenas prácticas de ingeniería y apoyar a futuros egresados de la UMSS.",
    isAvailable: true,
    technicalAreas: ["Backend", "Arquitectura", "Cloud"],
    guidanceTypes: [
      {
        id: 1,
        name: "Revisión de CV",
        description:
          "Orientación para mejorar hojas de vida enfocadas en roles tecnológicos.",
      },
      {
        id: 2,
        name: "Orientación técnica",
        description:
          "Asesoramiento sobre arquitectura de software, patrones de diseño y preparación técnica.",
      },
    ],
  },

  {
    id: 2,
    name: "Carlos Mendoza",
    specialty: "Ingeniero Backend",
    professionalInterests: ["Desarrollo Backend", "APIs", "Bases de datos"],
    position: "Backend Developer",
    company: "Empresa tecnológica",
    yearsExperience: 5,
    faculty: "Facultad de Ciencias y Tecnología",
    program: "Lic. en Ingeniería Informática",
    description:
      "Profesional enfocado en desarrollo backend, APIs y bases de datos.",
    isAvailable: false,
    technicalAreas: ["Backend", "Bases de datos", "APIs"],
    guidanceTypes: [
      {
        id: 1,
        name: "Orientación técnica",
        description:
          "Orientación sobre desarrollo backend, APIs y bases de datos.",
      },
    ],
  },
];
