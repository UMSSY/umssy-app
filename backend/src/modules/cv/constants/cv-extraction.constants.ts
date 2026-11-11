import type { CvSectionHeading } from '../types/cv-section-heading.type.js';

export const CV_SECTION_HEADINGS: readonly CvSectionHeading[] = [
  {
    key: 'header',
    headings: [
      'datos personales',
      'informacion personal',
      'datos de contacto',
      'informacion de contacto',
      'contacto',
    ],
  },
  {
    key: 'education',
    headings: [
      'educacion',
      'formacion',
      'formacion academica',
      'formacion profesional',
      'educacion y formacion',
      'estudios',
      'estudios realizados',
      'estudios superiores',
      'titulos',
      'education',
    ],
  },
  {
    key: 'experience',
    headings: [
      'experiencia',
      'experiencia laboral',
      'experiencia profesional',
      'experiencia de trabajo',
      'trayectoria laboral',
      'trayectoria profesional',
      'historial laboral',
      'work experience',
      'experience',
    ],
  },
  {
    key: 'other',
    headings: [
      'perfil',
      'perfil profesional',
      'resumen',
      'resumen profesional',
      'sobre mi',
      'acerca de mi',
      'objetivo',
      'objetivo profesional',
      'habilidades',
      'habilidades tecnicas',
      'competencias',
      'aptitudes',
      'conocimientos',
      'idiomas',
      'certificaciones',
      'cursos',
      'cursos y certificaciones',
      'proyectos',
      'logros',
      'publicaciones',
      'voluntariado',
      'intereses',
      'referencias',
      'referencias personales',
      'referencias laborales',
      'skills',
      'languages',
    ],
  },
];

export const CV_HEADING_EDGE_PATTERN = /^[\s:.\-–—•|]+|[\s:.\-–—•|]+$/g;

export const CV_MONTH_NUMBERS: Readonly<Record<string, number>> = {
  enero: 1,
  ene: 1,
  january: 1,
  jan: 1,
  febrero: 2,
  feb: 2,
  february: 2,
  marzo: 3,
  mar: 3,
  march: 3,
  abril: 4,
  abr: 4,
  april: 4,
  apr: 4,
  mayo: 5,
  may: 5,
  junio: 6,
  jun: 6,
  june: 6,
  julio: 7,
  jul: 7,
  july: 7,
  agosto: 8,
  ago: 8,
  august: 8,
  aug: 8,
  septiembre: 9,
  setiembre: 9,
  september: 9,
  sept: 9,
  sep: 9,
  set: 9,
  octubre: 10,
  oct: 10,
  october: 10,
  noviembre: 11,
  nov: 11,
  november: 11,
  diciembre: 12,
  dic: 12,
  december: 12,
  dec: 12,
};

const MONTH_NAMES_SOURCE = Object.keys(CV_MONTH_NUMBERS)
  .sort((left, right) => right.length - left.length)
  .join('|');

const CURRENT_DATE_SOURCE =
  'actualidad|presente|actual|la fecha|hoy|present|current|now';

const RANGE_SEPARATOR_SOURCE = '\\s*(?:[-–—]|\\b(?:al|a|hasta|to)\\b)\\s*';

const datePatternSource = (prefix: string): string =>
  `(?:(?<${prefix}MonthName>${MONTH_NAMES_SOURCE})\\.?\\s*(?:del?\\s+)?|(?<${prefix}MonthNumber>0?[1-9]|1[0-2])\\s*[/.-]\\s*)?(?<${prefix}Year>(?:19|20)\\d{2})\\b`;

export const CV_DATE_RANGE_PATTERN = new RegExp(
  `\\b${datePatternSource('start')}${RANGE_SEPARATOR_SOURCE}(?:${datePatternSource('end')}|(?<current>${CURRENT_DATE_SOURCE})\\b)`,
  'i',
);

export const CV_SINGLE_DATE_PATTERN = new RegExp(
  `\\b${datePatternSource('single')}`,
  'i',
);

export const CV_DATE_LIMITS = {
  minYear: 1940,
  maxYearsAhead: 10,
  defaultMonth: 1,
  defaultDay: 1,
} as const;

export const CV_REMAINDER_EDGE_PATTERN =
  /^[\s|,;:()[\]–—-]+|[\s|,;:()[\]–—-]+$/g;

export const CV_PART_SEPARATOR_PATTERN =
  /\s+[|–—-]\s+|\s*[|•·;]\s*|\s*,\s*|\s+@\s+/;

export const CV_BULLET_PATTERN = /^[•·▪●◦*\-–]\s*/;

export const CV_ENTRY_HEADER_MAX_LINES = 2;

export const CV_MAX_ENTRIES = 20;

export const CV_EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

export const CV_PHONE_CANDIDATE_PATTERN = /\+?\d[\d\s-]{5,}\d/g;

export const CV_PHONE_LABEL_PATTERN =
  /\b(?:tel[eé]fono|tel|cel|celular|m[oó]vil|whatsapp|phone)\b/i;

export const CV_LOCATION_LABEL_PATTERN =
  /^(?:direcci[oó]n|domicilio|ciudad|ubicaci[oó]n|residencia|location)\s*:\s*(?<value>.+)$/i;

export const CV_COUNTRY_PATTERN = /\bbolivia\b/i;

export const CV_NAME_LABEL_PATTERN = /^nombres?(?:\s+completo)?\s*:\s*/i;

export const CV_NAME_EXCLUDED_TERMS: readonly string[] = [
  'curriculum vitae',
  'curriculum',
  'hoja de vida',
  'resume',
];

export const CV_DIGIT_PATTERN = /\d/;

export const CV_NAME_WORD_PATTERN = /^[\p{L}'.-]+$/u;

export const CV_NAME_WORD_LIMITS = {
  min: 2,
  max: 5,
  compoundFirstNameFrom: 4,
  compoundFirstNameWords: 2,
} as const;

export const CV_COMPANY_KEYWORDS: readonly string[] = [
  'sa',
  'srl',
  'ltda',
  'inc',
  'corp',
  'company',
  'empresa',
  'banco',
  'ministerio',
  'gobierno',
  'alcaldia',
  'consultora',
  'fundacion',
  'universidad',
  'cooperativa',
  'tecnologias',
  'solutions',
  'software',
];

export const CV_INSTITUTION_KEYWORDS: readonly string[] = [
  'universidad',
  'instituto',
  'escuela',
  'colegio',
  'facultad',
  'unidad educativa',
  'university',
];

export const CV_DEGREE_KEYWORDS: readonly string[] = [
  'licenciatura',
  'licenciado',
  'licenciada',
  'ingenieria',
  'ingeniero',
  'ingeniera',
  'tecnico',
  'tecnica',
  'maestria',
  'magister',
  'doctorado',
  'diplomado',
  'especialidad',
  'bachiller',
  'carrera',
  'master',
  'bachelor',
];

export const CV_FIELD_MAX_LENGTHS = {
  personName: 100,
  location: 150,
  institution: 255,
  degree: 255,
  educationDescription: 400,
  companyName: 100,
  position: 150,
  workExperienceDescription: 5000,
} as const;
