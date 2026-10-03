import type { MentorProfile } from "../types/mentor-profile.types";

export const MENTOR_PROFILES: MentorProfile[] = [
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
  {
    id: 3, name: "Daniela López Mendoza", specialty: "Calidad de software",
    professionalInterests: ["Testing", "Automatización"], position: "Ingeniera de Calidad de Software",
    company: "Equipo de productos digitales", yearsExperience: 4,
    faculty: "Facultad de Ciencias y Tecnología", program: "Lic. en Ingeniería de Sistemas",
    description: "Acompaño a profesionales que desean comenzar en pruebas y automatización de software.",
    isAvailable: true, technicalAreas: ["QA", "Testing", "Automatización"],
    guidanceTypes: [{ id: 1, name: "Orientación técnica", description: "Preparación de pruebas y primeros proyectos de automatización." }],
  },
  {
    id: 4, name: "José Miguel Fernández", specialty: "Desarrollo frontend",
    professionalInterests: ["Accesibilidad", "Interfaces web"], position: "Desarrollador Frontend",
    company: "Estudio de software", yearsExperience: 3,
    faculty: "Facultad de Ciencias y Tecnología", program: "Lic. en Ingeniería Informática",
    description: "Comparto experiencias sobre interfaces accesibles y desarrollo de aplicaciones web.",
    isAvailable: true, technicalAreas: ["Frontend", "React", "TypeScript"],
    guidanceTypes: [{ id: 1, name: "Revisión de portafolio", description: "Revisión de proyectos web y recomendaciones para presentar tu trabajo." }],
  },
  {
    id: 5, name: "Alejandra Carolina Mendoza Fernández", specialty: "Arquitectura de software",
    professionalInterests: ["Sistemas distribuidos", "Cloud"],
    position: "Especialista en arquitectura y desarrollo de plataformas empresariales",
    company: "Consultoría tecnológica", yearsExperience: 10,
    faculty: "Facultad de Ciencias y Tecnología", program: "Lic. en Ingeniería de Sistemas",
    description: "Experiencia en diseño de plataformas empresariales y acompañamiento de equipos de desarrollo.",
    isAvailable: false, technicalAreas: ["Arquitectura de software", "Backend", "Cloud", "Microservicios"],
    guidanceTypes: [{ id: 1, name: "Orientación profesional", description: "Planificación del crecimiento profesional en arquitectura de software." }],
  },
  {
    id: 6, name: "Fernando Rojas", specialty: "Bases de datos",
    professionalInterests: [], position: "", company: "No registrada", yearsExperience: 2,
    faculty: "Facultad de Ciencias y Tecnología", program: "Lic. en Ingeniería Informática",
    description: "Interés en modelado y administración de bases de datos.",
    isAvailable: true, technicalAreas: ["Bases de datos"], guidanceTypes: [],
  },
];
