import { EMPLOYMENT_STATUSES, SALARY_RANGES } from './heatmap.constants.js';

export const HEATMAP_SEED_GRADUATES = 160;
export const HEATMAP_SEED_RANDOM_SEED = 2026;
export const HEATMAP_SEED_FIRST_RESPONSE = '2022-01-10T12:00:00-04:00';
export const HEATMAP_SEED_SURVEY_OPENS_AT = '2022-01-01T00:00:00-04:00';
// Hash de la contraseña compartida por los usuarios de demostración.
export const HEATMAP_SEED_PASSWORD_HASH =
  '$2b$10$SGuj5IRujU5usBlVbAoDReuM2PeOD74IjT/3GGnWk2FoiCVCKeWxm';

export const HEATMAP_SEED_CAREERS = [
  'Licenciatura en Ingeniería de Sistemas',
  'Licenciatura Ingeniería en Informática',
] as const;

export const HEATMAP_SEED_COMPANIES = [
  'Seed: Nube Andina',
  'Seed: Código Horizonte',
  'Seed: Prisma Laboratorio',
  'Seed: Circuito Azul',
  'Seed: Bit Valle',
  'Seed: Vector Sur',
  'Seed: Nodo Abierto',
  'Seed: Datos Aurora',
] as const;

export const HEATMAP_SEED_POSITIONS = [
  'Desarrollador backend',
  'Desarrollador frontend',
  'Analista de datos',
  'Ingeniero DevOps',
  'Analista de sistemas',
  'Ingeniero QA',
] as const;

export const HEATMAP_SEED_FIRST_NAMES = [
  'Ariana', 'Benjamín', 'Camila', 'Diego', 'Estela', 'Franco', 'Gabriela', 'Héctor',
  'Isabel', 'Jorge', 'Karen', 'Luis', 'Mónica', 'Nicolás', 'Paola', 'Rodrigo',
] as const;

export const HEATMAP_SEED_LAST_NAMES = [
  'Mapa Demo', 'Calor Demo', 'Matriz Demo', 'Celda Demo', 'Escala Demo',
] as const;

// Probabilidad base por carrera e incremento por año de experiencia.
export const HEATMAP_SEED_SKILLS = [
  { name: 'SQL', systems: 0.72, informatics: 0.62, perYear: 0.02 },
  { name: 'JavaScript', systems: 0.55, informatics: 0.68, perYear: 0.01 },
  { name: 'TypeScript', systems: 0.35, informatics: 0.48, perYear: 0.02 },
  { name: 'Python', systems: 0.45, informatics: 0.55, perYear: 0 },
  { name: 'Java', systems: 0.42, informatics: 0.3, perYear: 0.03 },
  { name: 'React', systems: 0.34, informatics: 0.5, perYear: -0.01 },
  { name: 'Node.js', systems: 0.3, informatics: 0.42, perYear: 0.01 },
  { name: 'Docker', systems: 0.2, informatics: 0.26, perYear: 0.05 },
  { name: 'Git', systems: 0.7, informatics: 0.76, perYear: 0.01 },
  { name: 'AWS', systems: 0.14, informatics: 0.2, perYear: 0.05 },
  { name: 'PostgreSQL', systems: 0.4, informatics: 0.34, perYear: 0.02 },
  { name: 'Machine Learning', systems: 0.08, informatics: 0.18, perYear: 0.01 },
] as const;

export const HEATMAP_SEED_SURVEY = {
  key: 'heatmap-employability',
  title: 'Encuesta de empleabilidad e ingresos',
  description:
    'Datos de demostración para los mapas de calor de habilidades, ingresos y empleabilidad.',
  employmentOptions: EMPLOYMENT_STATUSES.map((status) => status.label),
  salaryOptions: SALARY_RANGES.map((range) => range.label),
} as const;
