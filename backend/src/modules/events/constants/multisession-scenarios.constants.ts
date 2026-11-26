// Talleres de demostración para QA (27/11/2026) y la sprint review (28/11/2026, 07:30–08:00).
// Fechas y horas fijas en hora de Bolivia para poder re-ejecutar el seed sin mover los horarios.

export const MULTISESSION_SUPPORTER_EMAILS = [
  'mentor.a@umssy.test',
  'mentor.b@umssy.test',
  'titulado.1@umssy.test',
  'estudiante.1@umssy.test',
  'admin.1@umssy.test',
  'admin.2@umssy.test',
  'empresa@umssy.test',
  'admin.titulado@umssy.test',
  'multi.role@umssy.test',
] as const;

export type MultisessionScenarioKey =
  | 'kubernetes'
  | 'postgresql'
  | 'playwright'
  | 'cybersecurity'
  | 'nestjs'
  | 'agile'
  | 'pandas'
  | 'docker'
  | 'git'
  | 'aws'
  | 'wireless'
  | 'react'
  | 'artificialIntelligence'
  | 'userExperience';

export interface MultisessionSessionDefinition {
  date: string;
  start: string;
  end: string;
}

export interface MultisessionAttendanceDefinition {
  // Índice de la sesión (0 = primera) y minutos después de su inicio.
  session: number;
  minutesAfterStart: number;
}

export interface MultisessionRegistrationDefinition {
  // 'participant' es la cuenta de Diego; el resto son correos de apoyos.
  user: 'participant' | (typeof MULTISESSION_SUPPORTER_EMAILS)[number];
  cancelled?: boolean;
  attendances?: MultisessionAttendanceDefinition[];
}

export interface MultisessionScenarioDefinition {
  key: MultisessionScenarioKey;
  number: number;
  title: string;
  description: string;
  category: string;
  instructorName: string;
  location: string;
  kind: 'proposal' | 'expired' | 'published';
  createdAt: { date: string; time: string };
  votingDeadline?: { date: string; time: string };
  sessions: MultisessionSessionDefinition[];
  registrations: MultisessionRegistrationDefinition[];
}

export const MULTISESSION_CAPACITY = 20;
export const MULTISESSION_SUPPORT_THRESHOLD = 10;

const LAB_2 = 'Laboratorio de Cómputo 2, Edificio de Tecnología, FCyT';
const LAB_NETWORKS = 'Laboratorio de Redes, Edificio de Tecnología, FCyT';
const AUDITORIUM = 'Auditorio de la FCyT, Campus Central';
const ROOM_690B = 'Aula 690B, Edificio Nuevo, FCyT';

const supporters = (count: number): MultisessionRegistrationDefinition[] =>
  MULTISESSION_SUPPORTER_EMAILS.slice(0, count).map((user) => ({ user }));

export const MULTISESSION_SCENARIOS: readonly MultisessionScenarioDefinition[] = [
  {
    key: 'kubernetes',
    number: 1,
    title: 'Introducción a Kubernetes para equipos de desarrollo',
    description:
      'Despliegue de aplicaciones en contenedores con Kubernetes: pods, servicios, configuración y escalado. Incluye prácticas guiadas en un clúster local.',
    category: 'Tecnología',
    instructorName: 'Ing. Rodrigo Salazar Peña',
    location: LAB_2,
    kind: 'proposal',
    createdAt: { date: '2026-11-24', time: '10:00' },
    votingDeadline: { date: '2026-12-04', time: '10:00' },
    sessions: [
      { date: '2026-12-08', start: '09:00', end: '11:00' },
      { date: '2026-12-10', start: '09:00', end: '11:00' },
    ],
    registrations: [],
  },
  {
    key: 'postgresql',
    number: 2,
    title: 'Diseño de bases de datos relacionales con PostgreSQL',
    description:
      'Modelado entidad-relación, normalización, índices y consultas eficientes en PostgreSQL, con un caso práctico de un sistema académico.',
    category: 'Tecnología',
    instructorName: 'Lic. Andrea Vargas Céspedes',
    location: LAB_2,
    kind: 'proposal',
    createdAt: { date: '2026-11-24', time: '11:00' },
    votingDeadline: { date: '2026-12-04', time: '11:00' },
    sessions: [
      { date: '2026-12-08', start: '14:00', end: '16:00' },
      { date: '2026-12-10', start: '14:00', end: '16:00' },
    ],
    registrations: supporters(5),
  },
  {
    key: 'playwright',
    number: 3,
    title: 'Automatización de pruebas end-to-end con Playwright',
    description:
      'Pruebas de interfaz automatizadas con Playwright: selectores, aserciones, fixtures y ejecución en integración continua sobre una aplicación web real.',
    category: 'Tecnología',
    instructorName: 'Ing. Marcelo Quiroga Antezana',
    location: LAB_2,
    kind: 'proposal',
    createdAt: { date: '2026-11-24', time: '12:00' },
    votingDeadline: { date: '2026-12-04', time: '12:00' },
    sessions: [
      { date: '2026-12-09', start: '09:00', end: '11:00' },
      { date: '2026-12-11', start: '09:00', end: '11:00' },
    ],
    registrations: supporters(9),
  },
  {
    key: 'cybersecurity',
    number: 4,
    title: 'Fundamentos de ciberseguridad para aplicaciones web',
    description:
      'Vulnerabilidades más comunes en aplicaciones web, autenticación segura y buenas prácticas de protección de datos, con ejercicios de análisis de casos.',
    category: 'Seguridad',
    instructorName: 'Ing. Natalia Guzmán Rocha',
    location: LAB_NETWORKS,
    kind: 'expired',
    createdAt: { date: '2026-11-14', time: '10:00' },
    votingDeadline: { date: '2026-11-24', time: '10:00' },
    sessions: [
      { date: '2026-12-01', start: '14:00', end: '16:00' },
      { date: '2026-12-03', start: '14:00', end: '16:00' },
    ],
    registrations: supporters(4),
  },
  {
    key: 'nestjs',
    number: 5,
    title: 'Desarrollo de APIs REST con NestJS y Prisma',
    description:
      'Construcción de una API REST con NestJS: módulos, validación, acceso a datos con Prisma y documentación con Swagger, en tres sesiones prácticas.',
    category: 'Tecnología',
    instructorName: 'Ing. Carla Montaño Ríos',
    location: LAB_2,
    kind: 'published',
    createdAt: { date: '2026-11-01', time: '10:00' },
    sessions: [
      { date: '2026-12-01', start: '09:00', end: '11:00' },
      { date: '2026-12-03', start: '09:00', end: '11:00' },
      { date: '2026-12-05', start: '09:00', end: '11:00' },
    ],
    registrations: supporters(6),
  },
  {
    key: 'agile',
    number: 6,
    title: 'Gestión ágil de proyectos con Scrum y Kanban',
    description:
      'Roles, eventos y artefactos de Scrum, tableros Kanban y métricas de flujo, aplicados a la planificación de un proyecto de software en equipo.',
    category: 'Emprendimiento',
    instructorName: 'Lic. Andrea Vargas Céspedes',
    location: ROOM_690B,
    kind: 'published',
    createdAt: { date: '2026-11-01', time: '11:00' },
    sessions: [
      { date: '2026-12-03', start: '10:00', end: '12:00' },
      { date: '2026-12-07', start: '10:00', end: '12:00' },
    ],
    registrations: supporters(3),
  },
  {
    key: 'pandas',
    number: 7,
    title: 'Análisis exploratorio de datos con Pandas',
    description:
      'Limpieza, transformación y visualización de datos con Pandas y Matplotlib, trabajando con un conjunto de datos de titulados de la universidad.',
    category: 'IA & Datos',
    instructorName: 'Ing. Rodrigo Salazar Peña',
    location: LAB_2,
    kind: 'published',
    createdAt: { date: '2026-11-01', time: '12:00' },
    sessions: [
      { date: '2026-12-02', start: '09:00', end: '11:00' },
      { date: '2026-12-04', start: '09:00', end: '11:00' },
    ],
    registrations: supporters(3),
  },
  {
    key: 'docker',
    number: 8,
    title: 'Contenedores con Docker para desarrolladores',
    description:
      'Imágenes, contenedores, volúmenes y redes con Docker, y orquestación local con Docker Compose para un entorno de desarrollo completo.',
    category: 'Tecnología',
    instructorName: 'Ing. Marcelo Quiroga Antezana',
    location: LAB_NETWORKS,
    kind: 'published',
    createdAt: { date: '2026-11-02', time: '10:00' },
    sessions: [
      { date: '2026-11-26', start: '09:00', end: '11:00' },
      { date: '2026-11-29', start: '09:00', end: '11:00' },
      { date: '2026-11-30', start: '09:00', end: '11:00' },
    ],
    registrations: [
      { user: 'participant', attendances: [{ session: 0, minutesAfterStart: 6 }] },
      { user: 'mentor.a@umssy.test', attendances: [{ session: 0, minutesAfterStart: 3 }] },
      { user: 'titulado.1@umssy.test', attendances: [{ session: 0, minutesAfterStart: 9 }] },
      ...supporters(9).slice(3, 6),
    ],
  },
  {
    key: 'git',
    number: 9,
    title: 'Control de versiones avanzado con Git',
    description:
      'Ramas, rebase, resolución de conflictos y flujo de trabajo con pull requests para equipos que colaboran en un mismo repositorio.',
    category: 'Tecnología',
    instructorName: 'Ing. Natalia Guzmán Rocha',
    location: LAB_2,
    kind: 'published',
    createdAt: { date: '2026-11-02', time: '11:00' },
    sessions: [
      { date: '2026-11-23', start: '09:00', end: '11:00' },
      { date: '2026-11-25', start: '09:00', end: '11:00' },
    ],
    registrations: [
      {
        user: 'participant',
        attendances: [
          { session: 0, minutesAfterStart: 5 },
          { session: 1, minutesAfterStart: 4 },
        ],
      },
      { user: 'mentor.b@umssy.test', attendances: [{ session: 0, minutesAfterStart: 8 }] },
      ...supporters(9).slice(4, 7),
    ],
  },
  {
    key: 'aws',
    number: 10,
    title: 'Introducción a la computación en la nube con AWS',
    description:
      'Servicios básicos de AWS: cómputo, almacenamiento y bases de datos administradas, con el despliegue de una aplicación sencilla en la nube.',
    category: 'Tecnología',
    instructorName: 'Ing. Carla Montaño Ríos',
    location: AUDITORIUM,
    kind: 'published',
    createdAt: { date: '2026-11-03', time: '10:00' },
    sessions: [
      { date: '2026-11-27', start: '08:00', end: '13:00' },
      { date: '2026-11-27', start: '14:00', end: '20:00' },
    ],
    registrations: [
      { user: 'participant' },
      { user: 'titulado.1@umssy.test', cancelled: true },
      { user: 'estudiante.1@umssy.test', attendances: [{ session: 0, minutesAfterStart: 10 }] },
      { user: 'admin.titulado@umssy.test' },
      { user: 'multi.role@umssy.test' },
    ],
  },
  {
    key: 'wireless',
    number: 11,
    title: 'Seguridad en redes inalámbricas',
    description:
      'Configuración segura de redes Wi-Fi, cifrado WPA3, segmentación y detección de accesos no autorizados en redes de campus.',
    category: 'Seguridad',
    instructorName: 'Ing. Natalia Guzmán Rocha',
    location: LAB_NETWORKS,
    kind: 'published',
    createdAt: { date: '2026-11-03', time: '11:00' },
    sessions: [{ date: '2026-11-28', start: '06:00', end: '07:20' }],
    registrations: [
      { user: 'participant' },
      { user: 'mentor.a@umssy.test' },
      { user: 'admin.1@umssy.test' },
    ],
  },
  {
    key: 'react',
    number: 12,
    title: 'React avanzado: hooks y manejo de estado',
    description:
      'Hooks personalizados, contexto, manejo de estado del servidor y buenas prácticas de rendimiento en aplicaciones React de producción.',
    category: 'Tecnología',
    instructorName: 'Ing. Carla Montaño Ríos',
    location: LAB_2,
    kind: 'published',
    createdAt: { date: '2026-11-04', time: '10:00' },
    sessions: [
      { date: '2026-11-28', start: '07:35', end: '07:45' },
      { date: '2026-11-28', start: '07:50', end: '07:58' },
    ],
    registrations: [
      { user: 'participant' },
      { user: 'mentor.b@umssy.test' },
      { user: 'estudiante.1@umssy.test' },
      { user: 'empresa@umssy.test' },
    ],
  },
  {
    key: 'artificialIntelligence',
    number: 13,
    title: 'Inteligencia artificial aplicada a la ingeniería',
    description:
      'Uso práctico de modelos de aprendizaje automático para resolver problemas de ingeniería: preparación de datos, entrenamiento y evaluación.',
    category: 'IA & Datos',
    instructorName: 'Ing. Rodrigo Salazar Peña',
    location: AUDITORIUM,
    kind: 'proposal',
    createdAt: { date: '2026-11-25', time: '10:00' },
    votingDeadline: { date: '2026-12-05', time: '10:00' },
    sessions: [
      { date: '2026-12-14', start: '09:00', end: '11:00' },
      { date: '2026-12-16', start: '09:00', end: '11:00' },
    ],
    registrations: supporters(9),
  },
  {
    key: 'userExperience',
    number: 14,
    title: 'Diseño de experiencia de usuario para productos digitales',
    description:
      'Investigación con usuarios, arquitectura de información, prototipado y pruebas de usabilidad para mejorar productos digitales existentes.',
    category: 'Diseño',
    instructorName: 'Lic. Andrea Vargas Céspedes',
    location: ROOM_690B,
    kind: 'proposal',
    createdAt: { date: '2026-11-18', time: '07:40' },
    votingDeadline: { date: '2026-11-28', time: '07:40' },
    sessions: [
      { date: '2026-12-07', start: '15:00', end: '17:00' },
      { date: '2026-12-09', start: '15:00', end: '17:00' },
    ],
    registrations: supporters(6),
  },
];

// IDs fijos (UUID v4 válidos) para que cada ejecución actualice los mismos registros.
export function multisessionId(
  kind: 'event' | 'session' | 'registration',
  scenario: number,
  index = 0,
): string {
  const prefix = { event: '1', session: '2', registration: '3' }[kind];
  const suffix = `${String(scenario).padStart(4, '0')}${String(index).padStart(8, '0')}`;
  return `8a5e${prefix}000-2026-4000-8000-${suffix}`;
}
