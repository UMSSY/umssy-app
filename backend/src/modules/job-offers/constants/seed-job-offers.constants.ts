import {
  JobOfferContractType,
  JobOfferModality,
  JobOfferStatus,
} from '../types/job-offer.enum.js';

export const SEED_JOB_OFFER_MODALITIES = Object.values(JobOfferModality);

export const SEED_JOB_OFFER_CONTRACT_TYPES = Object.values(JobOfferContractType);

export const SEED_JOB_OFFER_STATUSES = Object.values(JobOfferStatus);

export const SEED_JOB_OFFER_SKILLS = [
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'SQL',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'Git',
  'Linux',
  'Django',
  'FastAPI',
  'Vue.js',
  'Angular',
  'MongoDB',
  'Redis',
  'Rust',
  'Assembly',
] as const;

export const SEED_JOB_OFFER_COMPANIES = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    title: 'TechBolivia S.R.L.',
    description: 'Empresa de desarrollo de software con sede en Cochabamba.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    title: 'NovaSoft Bolivia',
    description: 'Consultora de tecnología especializada en aplicaciones web.',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    title: 'Andes Data Labs',
    description: 'Laboratorio de análisis de datos e inteligencia artificial.',
  },
] as const;

export const SEED_JOB_OFFER_LOCATION_URL = 'https://maps.app.goo.gl/UmssCochabamba';
export const SEED_JOB_OFFERS = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    companyTitle: 'TechBolivia S.R.L.',
    title: 'Desarrollador Frontend React Junior',
    description:
      'Buscamos un desarrollador frontend para construir interfaces web.\n\nResponsabilidades:\n- Maquetar pantallas a partir de diseños en Figma\n- Consumir APIs REST\n- Escribir pruebas de componentes',
    category: 'Desarrollo de software',
    modality: JobOfferModality.REMOTE,
    contractType: JobOfferContractType.FULL_TIME,
    status: JobOfferStatus.PUBLISHED,
    positionsAvailable: 2,
    salaryMin: 5000,
    salaryMax: 7000,
    languages: 'Español, inglés básico',
    skills: ['React', 'TypeScript', 'Git'],
    daysAgo: 1,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    companyTitle: 'TechBolivia S.R.L.',
    title: 'Pasante Backend NestJS',
    description:
      'Pasantía para estudiantes de últimos semestres.\n\n- Desarrollo de endpoints con NestJS y Prisma\n- Acompañamiento de un desarrollador senior',
    category: 'Desarrollo de software',
    modality: JobOfferModality.HYBRID,
    contractType: JobOfferContractType.INTERNSHIP,
    status: JobOfferStatus.PUBLISHED,
    positionsAvailable: 3,
    salaryMin: undefined,
    salaryMax: undefined,
    languages: 'Español',
    skills: ['Node.js', 'TypeScript', 'PostgreSQL'],
    daysAgo: 4,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    companyTitle: 'TechBolivia S.R.L.',
    title: 'Ingeniero DevOps Senior',
    description:
      'Liderarás la automatización de despliegues y la infraestructura en la nube.\n\n* Pipelines de CI/CD\n* Contenedores y orquestación\n* Monitoreo',
    category: 'Infraestructura',
    modality: JobOfferModality.ON_SITE,
    contractType: JobOfferContractType.FULL_TIME,
    status: JobOfferStatus.PUBLISHED,
    positionsAvailable: 1,
    salaryMin: 12000,
    salaryMax: 15000,
    languages: 'Español, inglés intermedio',
    skills: ['Docker', 'Kubernetes', 'Linux'],
    daysAgo: 12,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    companyTitle: 'TechBolivia S.R.L.',
    title: 'Analista de Datos Medio Tiempo',
    description: 'Apoyo en reportes y limpieza de datos para el área comercial.',
    category: 'Datos',
    modality: JobOfferModality.REMOTE,
    contractType: JobOfferContractType.PART_TIME,
    status: JobOfferStatus.PUBLISHED,
    positionsAvailable: 1,
    salaryMin: 3500,
    salaryMax: undefined,
    languages: 'Español',
    skills: ['Python', 'SQL'],
    daysAgo: 25,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000005',
    companyTitle: 'TechBolivia S.R.L.',
    title: 'Desarrollador Fullstack Vue',
    description: 'Mantenimiento y nuevas funcionalidades del sistema de ventas.',
    category: 'Desarrollo de software',
    modality: JobOfferModality.HYBRID,
    contractType: JobOfferContractType.PART_TIME,
        status: JobOfferStatus.CLOSED,
    positionsAvailable: 1,
    salaryMin: 4000,
    salaryMax: 5500,
    languages: 'Español',
    skills: ['Vue.js', 'JavaScript', 'MongoDB'],
    daysAgo: 40,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000006',
    companyTitle: 'TechBolivia S.R.L.',
    title: 'Soporte Técnico Linux',
    description: 'Atención de incidencias de servidores y estaciones de trabajo.',
    category: 'Infraestructura',
    modality: JobOfferModality.ON_SITE,
    contractType: JobOfferContractType.INTERNSHIP,
    status: JobOfferStatus.CLOSED,
    positionsAvailable: 2,
    salaryMin: 2500,
    salaryMax: undefined,
    languages: 'Español',
    skills: ['Linux', 'Git'],
    daysAgo: 75,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000007',
    companyTitle: 'NovaSoft Bolivia',
    title: 'Desarrollador React Senior',
    description: 'Desarrollo de aplicaciones web para clientes internacionales.',
    category: 'Desarrollo de software',
    modality: JobOfferModality.REMOTE,
    contractType: JobOfferContractType.FULL_TIME,
    status: JobOfferStatus.PUBLISHED,
    positionsAvailable: 1,
    salaryMin: 10000,
    salaryMax: 13000,
    languages: 'Español, inglés avanzado',
    skills: ['React', 'Node.js'],
    daysAgo: 2,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000008',
    companyTitle: 'Andes Data Labs',
    title: 'Científico de Datos Junior',
    description: 'Modelos de aprendizaje automático para predicción de demanda.',
    category: 'Datos',
    modality: JobOfferModality.HYBRID,
    contractType: JobOfferContractType.FULL_TIME,
    status: JobOfferStatus.PUBLISHED,
    positionsAvailable: 1,
    salaryMin: 7000,
    salaryMax: 9000,
    languages: 'Español, inglés intermedio',
    skills: ['Python', 'FastAPI', 'PostgreSQL'],
    daysAgo: 6,
  },
] as const satisfies readonly {
  id: string;
  companyTitle: (typeof SEED_JOB_OFFER_COMPANIES)[number]['title'];
  title: string;
  description: string;
  category: string;
  modality: JobOfferModality;
  contractType: JobOfferContractType;
  status: JobOfferStatus;
  positionsAvailable: number;
  salaryMin: number | undefined;
  salaryMax: number | undefined;
  languages: string;
  skills: readonly (typeof SEED_JOB_OFFER_SKILLS)[number][];
  daysAgo: number;
}[];