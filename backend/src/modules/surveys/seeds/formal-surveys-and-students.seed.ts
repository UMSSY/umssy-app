import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { Prisma, PrismaClient } from '../../../prisma/client.js';
import { createSeedClient } from '../../../common/database/seed-client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';
import {
  SurveyQuestionType,
  SurveyStatus,
  SurveyTargetAudience,
} from '../types/survey.enum.js';

// Precomputed bcrypt hash of 'Prueba123' with 10 salt rounds
const PASSWORD_HASH =
  '$2b$10$SGuj5IRujU5usBlVbAoDReuM2PeOD74IjT/3GGnWk2FoiCVCKeWxm';

export function deterministicUuid(key: string): string {
  const bytes = createHash('sha256')
    .update(`umssy-formal-v1:${key}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const FORMAL_GRADUATES = [
  // 5 Titulados de Sistemas
  {
    key: 'graduate-sis-1',
    email: 'titulado.sistemas1@umssy.test',
    firstName: 'Alejandro',
    lastName: 'Morales Vargas',
    career: 'Licenciatura en Ingeniería de Sistemas',
    degree: 'Ingeniería de Sistemas',
  },
  {
    key: 'graduate-sis-2',
    email: 'titulado.sistemas2@umssy.test',
    firstName: 'Valeria',
    lastName: 'Quiroga Rocha',
    career: 'Licenciatura en Ingeniería de Sistemas',
    degree: 'Ingeniería de Sistemas',
  },
  {
    key: 'graduate-sis-3',
    email: 'titulado.sistemas3@umssy.test',
    firstName: 'Rodrigo',
    lastName: 'Flores Balderrama',
    career: 'Licenciatura en Ingeniería de Sistemas',
    degree: 'Ingeniería de Sistemas',
  },
  {
    key: 'graduate-sis-4',
    email: 'titulado.sistemas4@umssy.test',
    firstName: 'Camila',
    lastName: 'Torrico Claros',
    career: 'Licenciatura en Ingeniería de Sistemas',
    degree: 'Ingeniería de Sistemas',
  },
  {
    key: 'graduate-sis-5',
    email: 'titulado.sistemas5@umssy.test',
    firstName: 'Mateo',
    lastName: 'Fernández Rios',
    career: 'Licenciatura en Ingeniería de Sistemas',
    degree: 'Ingeniería de Sistemas',
  },
  // 5 Titulados de Informática
  {
    key: 'graduate-inf-1',
    email: 'titulado.informatica1@umssy.test',
    firstName: 'Luciana',
    lastName: 'Vargas Mercado',
    career: 'Licenciatura Ingeniería en Informática',
    degree: 'Ingeniería Informática',
  },
  {
    key: 'graduate-inf-2',
    email: 'titulado.informatica2@umssy.test',
    firstName: 'Gabriel',
    lastName: 'Mendoza Soliz',
    career: 'Licenciatura Ingeniería en Informática',
    degree: 'Ingeniería Informática',
  },
  {
    key: 'graduate-inf-3',
    email: 'titulado.informatica3@umssy.test',
    firstName: 'Natalia',
    lastName: 'Soliz Camacho',
    career: 'Licenciatura Ingeniería en Informática',
    degree: 'Ingeniería Informática',
  },
  {
    key: 'graduate-inf-4',
    email: 'titulado.informatica4@umssy.test',
    firstName: 'Diego',
    lastName: 'Claros Montaño',
    career: 'Licenciatura Ingeniería en Informática',
    degree: 'Ingeniería Informática',
  },
  {
    key: 'graduate-inf-5',
    email: 'titulado.informatica5@umssy.test',
    firstName: 'Andrea',
    lastName: 'Guzmán Terán',
    career: 'Licenciatura Ingeniería en Informática',
    degree: 'Ingeniería Informática',
  },
];

export const SECONDARY_ADMIN = {
  key: 'admin-amlopobra',
  email: 'amlopobra@gmail.com',
  firstName: 'Admin',
  lastName: 'López',
};

export interface QuestionDefinition {
  statement: string;
  type: (typeof SurveyQuestionType)[keyof typeof SurveyQuestionType];
  options: string[];
}

export interface SurveyDefinition {
  keySuffix: string;
  title: string;
  description: string;
  questionCount: number;
  computeSchedule: (now: Date) => {
    opensAt: Date;
    closesAt: Date;
    closingSoonNotifiedAt: Date | null;
    closedNotifiedAt: Date | null;
  };
  questions: QuestionDefinition[];
}

export const FORMAL_SURVEY_DEFINITIONS: SurveyDefinition[] = [
  // Encuesta 1 (5 preguntas) - Vencida hace 5 minutos
  {
    keySuffix: 's1-competencias-5p',
    title: 'Evaluación de Competencias Profesionales e Inserción Laboral',
    description:
      'Estudio institucional sobre la pertinencia y aplicación de las competencias adquiridas durante la formación universitaria en el entorno laboral actual.',
    questionCount: 5,
    computeSchedule: (now: Date) => ({
      opensAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      closesAt: new Date(now.getTime() - 5 * 60 * 1000), // Vencida hace 5 minutos
      closingSoonNotifiedAt: new Date(
        now.getTime() - 3 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000,
      ),
      closedNotifiedAt: null, // Listo para notificar cierre inmediato
    }),
    questions: [
      {
        statement:
          '¿En qué sector productivo desempeña actualmente su actividad profesional principal?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Sector privado empresarial',
          'Sector público o gubernamental',
          'Emprendimiento tecnológico propio',
          'Consultoría y servicios independientes',
          'Sector académico o de investigación',
        ],
      },
      {
        statement:
          '¿Qué nivel de afinidad existe entre las responsabilidades de su puesto y su perfil de egreso?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Totalmente afín a la carrera',
          'Altamente afín con tareas complementarias',
          'Moderadamente afín',
          'Poca o nula afinidad',
        ],
      },
      {
        statement:
          '¿Cuáles son las áreas técnicas fundamentales que aplica con mayor rigor en sus proyectos?',
        type: SurveyQuestionType.MULTIPLE_CHOICE,
        options: [
          'Arquitectura y desarrollo de software',
          'Ciencia de datos, analítica e inteligencia artificial',
          'Seguridad de la información y auditoría',
          'Computación en la nube y cultura DevOps',
          'Redes, infraestructura y telecomunicaciones',
        ],
      },
      {
        statement:
          '¿Considera que la formación en metodologías y buenas prácticas recibida en la facultad fue adecuada?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Totalmente adecuada y actualizada',
          'Parcialmente adecuada',
          'Insuficiente frente a las exigencias laborales',
          'No se abordaron adecuadamente durante la carrera',
        ],
      },
      {
        statement:
          '¿Cómo califica la preparación integral brindada por la universidad para resolver problemas complejos?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: ['Excelente', 'Muy buena', 'Regular', 'Deficiente'],
      },
    ],
  },

  // Encuesta 2 (6 preguntas) - Alerta de vencimiento en 20 minutos
  {
    keySuffix: 's2-trayectoria-6p',
    title: 'Seguimiento de Trayectoria Profesional y Empleabilidad Temprana',
    description:
      'Relevamiento de datos sobre el tiempo de inserción en el mercado, condiciones contractuales y evolución salarial de los titulados.',
    questionCount: 6,
    computeSchedule: (now: Date) => ({
      opensAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      // Cierra exactamente en 3 días + 20 minutos -> entrará a la ventana de 3 días en 20 minutos
      closesAt: new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000,
      ),
      closingSoonNotifiedAt: null,
      closedNotifiedAt: null,
    }),
    questions: [
      {
        statement:
          '¿Cuánto tiempo transcurrió desde la conclusión del plan de estudios hasta obtener su primer empleo?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Obtuve empleo antes de concluir estudios',
          'Menos de 3 meses',
          'Entre 3 y 6 meses',
          'Entre 6 y 12 meses',
          'Más de 12 meses',
        ],
      },
      {
        statement:
          '¿A través de qué canal o medio principal accedió a su ocupación laboral vigente?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Bolsa de trabajo y convenios universitarios',
          'Redes profesionales y plataformas digitales (LinkedIn)',
          'Recomendación o red de contactos profesionales',
          'Convocatoria abierta o concurso de méritos',
          'Iniciativa empresarial o emprendimiento',
        ],
      },
      {
        statement:
          '¿Cuál es el esquema y modalidad de trabajo bajo el cual presta servicios actualmente?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Remoto a tiempo completo (teletrabajo)',
          'Modalidad híbrida (presencial y remoto)',
          'Modalidad presencial a tiempo completo',
          'Prestación de servicios por proyectos o consultoría',
        ],
      },
      {
        statement:
          '¿En qué rango se sitúa su compensación económica mensual bruta aproximada (en Bs)?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Menor a 4.000 Bs',
          'Entre 4.000 y 7.000 Bs',
          'Entre 7.001 y 12.000 Bs',
          'Superior a 12.000 Bs',
        ],
      },
      {
        statement:
          '¿Su organización actual ofrece planes formales de capacitación o financiamiento para certificaciones?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Sí, con planes estructurados y apoyo económico',
          'Ocasionalmente según requerimiento del proyecto',
          'Raras veces',
          'No contempla capacitación institucional',
        ],
      },
      {
        statement:
          '¿Recomendaría cursar esta carrera en la facultad a jóvenes postulantes con vocación tecnológica?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Definitivamente sí',
          'Probablemente sí',
          'Neutral / Indeciso',
          'Probablemente no',
        ],
      },
    ],
  },

  // Encuesta 3 (7 preguntas) - Alerta de vencimiento mañana a las 7:00 AM
  {
    keySuffix: 's3-actualizacion-7p',
    title: 'Impacto Curricular y Actualización Tecnológica del Egresado',
    description:
      'Análisis curricular continuo para identificar brechas tecnológicas emergentes y áreas de fortalecimiento en los planes de estudio.',
    questionCount: 7,
    computeSchedule: (now: Date) => {
      const tomorrow7am = new Date(now);
      tomorrow7am.setDate(tomorrow7am.getDate() + 1);
      tomorrow7am.setHours(7, 0, 0, 0);
      return {
        opensAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        // Cierra en 3 días contados desde mañana a las 7:00 AM -> activará la alerta mañana a las 7:00 AM
        closesAt: new Date(tomorrow7am.getTime() + 3 * 24 * 60 * 60 * 1000),
        closingSoonNotifiedAt: null,
        closedNotifiedAt: null,
      };
    },
    questions: [
      {
        statement:
          '¿En qué grado las tecnologías aprendidas durante su formación conservan vigencia práctica en su labor?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Muy vigentes y fundamentales',
          'Moderadamente vigentes',
          'Parcialmente desactualizadas',
          'Completamente obsoletas',
        ],
      },
      {
        statement:
          '¿Qué contenidos o áreas emergentes considera prioritario profundizar en futuras reformas curriculares?',
        type: SurveyQuestionType.MULTIPLE_CHOICE,
        options: [
          'Inteligencia artificial generativa y modelos de lenguaje',
          'Infraestructura como código y arquitecturas nativas de nube',
          'Ciberseguridad ofensiva, defensiva y gobernanza de datos',
          'Desarrollo móvil avanzado y multiplataforma',
          'Gestión ágil de productos y liderazgo técnico',
        ],
      },
      {
        statement:
          '¿Cómo valora la articulación entre contenidos teóricos y laboratorios prácticos durante su carrera?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Altamente articulada y pertinente',
          'Predominio teórico con prácticas insuficientes',
          'Prácticas desvinculadas de fundamentos teóricos sólidos',
          'Insatisfactoria en ambos aspectos',
        ],
      },
      {
        statement:
          '¿Requirió cursar diplomados, certificaciones o cursos externos para integrarse productivamente a su empresa?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Sí, certificaciones internacionales y posgrados especializados',
          'Cursos complementarios en tecnologías específicas',
          'Talleres breves de actualización',
          'No, la formación universitaria fue suficiente',
        ],
      },
      {
        statement:
          '¿Cuál es el nivel de dominio técnico del idioma inglés que demanda su puesto de trabajo?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Avanzado / Profesional bilingüe',
          'Intermedio para documentación técnica y comunicación escrita',
          'Básico para comprensión lectora',
          'No se requiere idioma extranjero',
        ],
      },
      {
        statement:
          '¿Mantiene participación en comunidades técnicas, eventos tecnológicos o proyectos de código abierto?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Sí, como ponente, organizador o mantenedor activo',
          'Sí, como participante frecuente y colaborador',
          'Eventualmente como oyente',
          'No participo en comunidades técnicas',
        ],
      },
      {
        statement:
          '¿Cómo califica la rigurosidad y exigencia académica general del programa de estudios cursado?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Muy rigurosa y altamente formadora',
          'Adecuada a los estándares de la disciplina',
          'Moderadamente rigurosa',
          'Poco rigurosa',
        ],
      },
    ],
  },

  // Encuesta 4 (8 preguntas) - Alerta de vencimiento pasado mañana a la 1:00 PM
  {
    keySuffix: 's4-liderazgo-8p',
    title: 'Calidad de Formación Integral, Liderazgo y Posgrado',
    description:
      'Evaluación de habilidades blandas, capacidades de liderazgo, ética profesional y proyección hacia estudios de posgrado.',
    questionCount: 8,
    computeSchedule: (now: Date) => {
      const dayAfterTomorrow1pm = new Date(now);
      dayAfterTomorrow1pm.setDate(dayAfterTomorrow1pm.getDate() + 2);
      dayAfterTomorrow1pm.setHours(13, 0, 0, 0);
      return {
        opensAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        // Cierra en 3 días contados desde pasado mañana a las 13:00 -> activará la alerta pasado mañana a las 13:00
        closesAt: new Date(
          dayAfterTomorrow1pm.getTime() + 3 * 24 * 60 * 60 * 1000,
        ),
        closingSoonNotifiedAt: null,
        closedNotifiedAt: null,
      };
    },
    questions: [
      {
        statement:
          '¿Desempeña actualmente funciones de liderazgo técnico, gestión de equipos o coordinación de proyectos?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Sí, lidero formalmente equipos de desarrollo o técnicos',
          'Sí, coordino proyectos o células de trabajo ágiles',
          'No, desempeño rol de especialista o colaborador individual',
          'No tengo responsabilidades de gestión por el momento',
        ],
      },
      {
        statement:
          '¿Cuáles competencias transversales o blandas han tenido mayor impacto positivo en su carrera?',
        type: SurveyQuestionType.MULTIPLE_CHOICE,
        options: [
          'Comunicación oral y escrita asertiva',
          'Trabajo colaborativo en equipos multidisciplinarios',
          'Capacidad de negociación y resolución de conflictos',
          'Gestión eficaz del tiempo y priorización bajo presión',
          'Proactividad, autoaprendizaje y resiliencia',
        ],
      },
      {
        statement:
          '¿Tiene proyectado o se encuentra realizando estudios avanzados de posgrado universitario?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Cursando actualmente programa de maestría o doctorado',
          'Cursando actualmente diplomado de especialización',
          'Tengo planificado iniciar posgrado en los próximos 12 meses',
          'No figura entre mis metas inmediatas',
        ],
      },
      {
        statement:
          '¿En cuál de las siguientes áreas temáticas orientaría prioritariamente su especialización de posgrado?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Inteligencia artificial, aprendizaje automático y big data',
          'Ciberseguridad, seguridad de la información y cómputo forense',
          'Dirección estratégica, gestión de TI y transformación digital',
          'Arquitectura de software distribuido y computación en la nube',
        ],
      },
      {
        statement:
          '¿Considera que la formación en ética y responsabilidad profesional adquirida guía sus decisiones laborales?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Totalmente de acuerdo',
          'De acuerdo',
          'Neutral / No determinable',
          'En desacuerdo',
        ],
      },
      {
        statement:
          '¿Estaría dispuesto a colaborar con la facultad como expositor invitado, jurado o mentor de estudiantes?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Sí, con total predisposición y entusiasmo',
          'Sí, sujeto a compatibilidad de horarios laborales',
          'Quizás más adelante en mi carrera',
          'No me resulta viable actualmente',
        ],
      },
      {
        statement:
          '¿Cómo percibe la reputación y valoración de los graduados de la UMSS entre los empleadores del sector?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Altamente reconocida y preferida en el mercado',
          'Favorable y competitiva frente a otras instituciones',
          'Percepción estándar o neutra',
          'Menos valorada de lo esperado',
        ],
      },
      {
        statement:
          'En una valoración global, ¿cuál es su grado de satisfacción con la experiencia formativa vivida en la universidad?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        options: [
          'Plenamente satisfecho y orgulloso',
          'Satisfecho con aspectos puntuales a mejorar',
          'Parcialmente satisfecho',
          'Insatisfecho con la formación recibida',
        ],
      },
    ],
  },
];

// Asignación de 3 encuestas respondidas de las 4 posibles para cada uno de los 10 titulados
const GRADUATE_ANSWERED_SURVEY_INDEXES: number[][] = [
  [0, 1, 2], // Titulado 0 omite la 3
  [0, 1, 3], // Titulado 1 omite la 2
  [0, 2, 3], // Titulado 2 omite la 1
  [1, 2, 3], // Titulado 3 omite la 0
  [0, 1, 2], // Titulado 4 omite la 3
  [0, 1, 3], // Titulado 5 omite la 2
  [0, 2, 3], // Titulado 6 omite la 1
  [1, 2, 3], // Titulado 7 omite la 0
  [0, 1, 2], // Titulado 8 omite la 3
  [0, 1, 3], // Titulado 9 omite la 2
];

export async function seedFormalSurveysAndStudents(
  tx: Prisma.TransactionClient,
  _context?: FixtureContext,
): Promise<number> {
  const now = new Date();

  // 1. Catálogos requeridos
  const publishedStatus = await tx.surveyStatus.findUniqueOrThrow({
    where: { title: SurveyStatus.PUBLISHED },
  });
  const audienceGraduates =
    (await tx.surveyTargetAudience.findUnique({
      where: { title: SurveyTargetAudience.GRADUATES },
    })) ??
    (await tx.surveyTargetAudience.findUniqueOrThrow({
      where: { title: SurveyTargetAudience.ALL },
    }));

  const singleChoiceType = await tx.surveyQuestionType.findUniqueOrThrow({
    where: { title: SurveyQuestionType.SINGLE_CHOICE },
  });
  const multipleChoiceType = await tx.surveyQuestionType.findUniqueOrThrow({
    where: { title: SurveyQuestionType.MULTIPLE_CHOICE },
  });

  const graduateRole = await tx.role.findUniqueOrThrow({
    where: { name: 'titulado' },
  });
  const adminRole = await tx.role.findUniqueOrThrow({
    where: { name: 'administrativo' },
  });

  const defaultCity = await tx.city.findFirstOrThrow();
  const approvedReqStatus = await tx.accessRequestStatus.findFirst({
    where: { title: { equals: 'approved', mode: 'insensitive' } },
  });

  // Limpiar usuarios anteriores de pruebas con prefijo estudiante si existen
  const oldUsers = await tx.user.findMany({
    where: {
      email: {
        in: [
          'estudiante.sistemas1@umssy.test',
          'estudiante.sistemas2@umssy.test',
          'estudiante.sistemas3@umssy.test',
          'estudiante.sistemas4@umssy.test',
          'estudiante.sistemas5@umssy.test',
          'estudiante.informatica1@umssy.test',
          'estudiante.informatica2@umssy.test',
          'estudiante.informatica3@umssy.test',
          'estudiante.informatica4@umssy.test',
          'estudiante.informatica5@umssy.test',
        ],
      },
    },
    select: { id: true },
  });
  const oldUserIds = oldUsers.map((u) => u.id);
  if (oldUserIds.length > 0) {
    await tx.surveyResponse.deleteMany({
      where: { respondentId: { in: oldUserIds } },
    });
    await tx.education.deleteMany({
      where: { userId: { in: oldUserIds } },
    });
    await tx.userRole.deleteMany({
      where: { userId: { in: oldUserIds } },
    });
    await tx.accessRequest.deleteMany({
      where: {
        email: {
          in: [
            'estudiante.sistemas1@umssy.test',
            'estudiante.sistemas2@umssy.test',
            'estudiante.sistemas3@umssy.test',
            'estudiante.sistemas4@umssy.test',
            'estudiante.sistemas5@umssy.test',
            'estudiante.informatica1@umssy.test',
            'estudiante.informatica2@umssy.test',
            'estudiante.informatica3@umssy.test',
            'estudiante.informatica4@umssy.test',
            'estudiante.informatica5@umssy.test',
          ],
        },
      },
    });
    await tx.user.deleteMany({
      where: { id: { in: oldUserIds } },
    });
  }

  // 2. Administrador principal: admin.1@umssy.test
  const primaryAdmin = await tx.user.findUniqueOrThrow({
    where: { email: 'admin.1@umssy.test' },
    select: { id: true, email: true },
  });

  // 3. Administrador secundario: amlopobra@gmail.com
  const secondaryAdminId = deterministicUuid(SECONDARY_ADMIN.key);
  const secondaryAdmin = await tx.user.upsert({
    where: { email: SECONDARY_ADMIN.email },
    create: {
      id: secondaryAdminId,
      email: SECONDARY_ADMIN.email,
      firstName: SECONDARY_ADMIN.firstName,
      lastName: SECONDARY_ADMIN.lastName,
      password: PASSWORD_HASH,
      isActive: true,
      cityId: defaultCity.id,
      headline: 'Administrador de Plataforma y Gestión de Encuestas',
      aboutMe: 'Administrador responsable del seguimiento y métricas de encuestas.',
      createdAt: now,
      updatedAt: now,
    },
    update: {
      password: PASSWORD_HASH,
      isActive: true,
    },
    select: { id: true, email: true },
  });

  const existingAdminRole = await tx.userRole.findFirst({
    where: { userId: secondaryAdmin.id, roleId: adminRole.id },
  });
  if (!existingAdminRole) {
    await tx.userRole.create({
      data: {
        id: deterministicUuid('role-admin-amlopobra'),
        userId: secondaryAdmin.id,
        roleId: adminRole.id,
      },
    });
  }

  // 4. Crear los 10 titulados (5 Sistemas y 5 Informática)
  const graduateUserIds: string[] = [];
  for (let i = 0; i < FORMAL_GRADUATES.length; i++) {
    const graduate = FORMAL_GRADUATES[i];
    const graduateId = deterministicUuid(graduate.key);
    graduateUserIds.push(graduateId);

    const career = await tx.career.findFirst({
      where: { title: graduate.career },
    });

    await tx.user.upsert({
      where: { email: graduate.email },
      create: {
        id: graduateId,
        email: graduate.email,
        firstName: graduate.firstName,
        lastName: graduate.lastName,
        password: PASSWORD_HASH,
        isActive: true,
        cityId: defaultCity.id,
        headline: `Titulado de ${graduate.degree}`,
        aboutMe: `Perfil profesional de ${graduate.firstName} ${graduate.lastName}, titulado de ${graduate.career} en la Facultad de Ciencias y Tecnología (UMSS).`,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        password: PASSWORD_HASH,
        isActive: true,
      },
    });

    // Asignar rol titulado
    const hasGraduateRole = await tx.userRole.findFirst({
      where: { userId: graduateId, roleId: graduateRole.id },
    });
    if (!hasGraduateRole) {
      await tx.userRole.create({
        data: {
          id: deterministicUuid(`role-graduate-${graduate.key}`),
          userId: graduateId,
          roleId: graduateRole.id,
        },
      });
    }

    // Educación (concluido)
    const educationId = deterministicUuid(`edu-${graduate.key}`);
    const existingEdu = await tx.education.findFirst({
      where: { userId: graduateId },
    });
    if (!existingEdu) {
      await tx.education.create({
        data: {
          id: educationId,
          userId: graduateId,
          institution: 'Universidad Mayor de San Simón (UMSS)',
          degree: graduate.degree,
          startDate: new Date('2020-02-01T00:00:00.000Z'),
          endDate: new Date('2025-11-30T00:00:00.000Z'),
          description: 'Graduado de la Facultad de Ciencias y Tecnología.',
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // AccessRequest aprobado para que findGraduateProfile() devuelva la carrera correspondiente
    if (career && approvedReqStatus) {
      const existingReq = await tx.accessRequest.findFirst({
        where: { email: graduate.email },
      });
      if (!existingReq) {
        await tx.accessRequest.create({
          data: {
            id: deterministicUuid(`req-${graduate.key}`),
            requestCode: `FORMAL-TIT-2026-${String(i + 1).padStart(4, '0')}`,
            email: graduate.email,
            firstName: graduate.firstName,
            lastName: graduate.lastName,
            idCardNumber: `910000${i + 1}`,
            idCardIssuedIn: 'CB',
            sisCode: `20200000${i + 1}`,
            birthDate: new Date('2000-05-15T00:00:00.000Z'),
            careerId: career.id,
            statusId: approvedReqStatus.id,
            graduationYear: 2025,
            submittedAt: now,
            reviewedAt: now,
          },
        });
      }
    }
  }

  // 5. Crear encuestas para ambos administradores
  const surveyOwners = [
    { prefix: 'admin1', admin: primaryAdmin },
    { prefix: 'amlopobra', admin: secondaryAdmin },
  ];

  let totalItemsCreated = 0;

  for (const owner of surveyOwners) {
    const ownerSurveyIds: string[] = [];

    for (let sIdx = 0; sIdx < FORMAL_SURVEY_DEFINITIONS.length; sIdx++) {
      const def = FORMAL_SURVEY_DEFINITIONS[sIdx];
      const surveyId = deterministicUuid(`${owner.prefix}-${def.keySuffix}`);
      ownerSurveyIds.push(surveyId);

      const schedule = def.computeSchedule(now);

      await tx.survey.upsert({
        where: { id: surveyId },
        create: {
          id: surveyId,
          title: def.title,
          description: def.description,
          careerId: null,
          targetsAllCareers: true,
          academicPeriod: 'Todas',
          targetAudienceId: audienceGraduates.id,
          statusId: publishedStatus.id,
          createdById: owner.admin.id,
          opensAt: schedule.opensAt,
          closesAt: schedule.closesAt,
          closingSoonNotifiedAt: schedule.closingSoonNotifiedAt,
          closedNotifiedAt: schedule.closedNotifiedAt,
          createdAt: schedule.opensAt,
          updatedAt: now,
        },
        update: {
          title: def.title,
          description: def.description,
          careerId: null,
          targetsAllCareers: true,
          academicPeriod: 'Todas',
          targetAudienceId: audienceGraduates.id,
          statusId: publishedStatus.id,
          opensAt: schedule.opensAt,
          closesAt: schedule.closesAt,
          closingSoonNotifiedAt: schedule.closingSoonNotifiedAt,
          closedNotifiedAt: schedule.closedNotifiedAt,
        },
      });

      // Configuración de alerta para la encuesta
      const alertConfigId = deterministicUuid(`alert-${owner.prefix}-${def.keySuffix}`);
      await tx.surveyAlertConfig.upsert({
        where: { surveyId },
        create: {
          id: alertConfigId,
          surveyId,
          isEnabled: true,
          threshold: 10,
        },
        update: {
          isEnabled: true,
          threshold: 10,
        },
      });

      // Preguntas y Opciones
      for (let qIdx = 0; qIdx < def.questions.length; qIdx++) {
        const qDef = def.questions[qIdx];
        const questionId = deterministicUuid(
          `${owner.prefix}-${def.keySuffix}-q${qIdx}`,
        );

        await tx.surveyQuestion.upsert({
          where: { id: questionId },
          create: {
            id: questionId,
            surveyId,
            position: qIdx + 1,
            statement: qDef.statement,
            typeId:
              qDef.type === SurveyQuestionType.MULTIPLE_CHOICE
                ? multipleChoiceType.id
                : singleChoiceType.id,
            isRequired: true,
          },
          update: {
            statement: qDef.statement,
            position: qIdx + 1,
            typeId:
              qDef.type === SurveyQuestionType.MULTIPLE_CHOICE
                ? multipleChoiceType.id
                : singleChoiceType.id,
          },
        });

        for (let oIdx = 0; oIdx < qDef.options.length; oIdx++) {
          const optText = qDef.options[oIdx];
          const optionId = deterministicUuid(
            `${owner.prefix}-${def.keySuffix}-q${qIdx}-opt${oIdx}`,
          );

          await tx.surveyQuestionOption.upsert({
            where: { id: optionId },
            create: {
              id: optionId,
              questionId,
              position: oIdx + 1,
              label: optText,
            },
            update: {
              label: optText,
              position: oIdx + 1,
            },
          });
        }
      }

      totalItemsCreated++;
    }

    // 6. Registrar respuestas de los titulados para las encuestas de este administrador
    for (
      let graduateIdx = 0;
      graduateIdx < graduateUserIds.length;
      graduateIdx++
    ) {
      const graduateId = graduateUserIds[graduateIdx];
      const surveysToAnswer = GRADUATE_ANSWERED_SURVEY_INDEXES[graduateIdx];

      for (const surveyIndex of surveysToAnswer) {
        const surveyId = ownerSurveyIds[surveyIndex];
        const def = FORMAL_SURVEY_DEFINITIONS[surveyIndex];
        const responseId = deterministicUuid(
          `resp-${owner.prefix}-${def.keySuffix}-${graduateIdx}`,
        );

        // Fecha de respuesta coherente (entre apertura y cierre)
        const schedule = def.computeSchedule(now);
        const submittedAt =
          surveyIndex === 0
            ? new Date(schedule.closesAt.getTime() - 2 * 60 * 60 * 1000) // 2 horas antes de cerrar
            : new Date(now.getTime() - (graduateIdx + 1) * 30 * 60 * 1000); // Horas previas

        await tx.surveyResponse.upsert({
          where: {
            surveyId_respondentId: { surveyId, respondentId: graduateId },
          },
          create: {
            id: responseId,
            surveyId,
            respondentId: graduateId,
            submittedAt,
            createdAt: submittedAt,
            updatedAt: submittedAt,
          },
          update: {
            submittedAt,
          },
        });

        // Registrar respuestas por pregunta
        for (let qIdx = 0; qIdx < def.questions.length; qIdx++) {
          const qDef = def.questions[qIdx];
          const questionId = deterministicUuid(
            `${owner.prefix}-${def.keySuffix}-q${qIdx}`,
          );
          const optCount = qDef.options.length;

          if (qDef.type === SurveyQuestionType.MULTIPLE_CHOICE) {
            const firstIdx = (graduateIdx + qIdx) % optCount;
            const secondIdx = (firstIdx + 1) % optCount;
            const selectedIndices = [firstIdx, secondIdx];

            for (const chosenOptIdx of selectedIndices) {
              const optionId = deterministicUuid(
                `${owner.prefix}-${def.keySuffix}-q${qIdx}-opt${chosenOptIdx}`,
              );
              const answerId = deterministicUuid(
                `ans-${owner.prefix}-${def.keySuffix}-${graduateIdx}-q${qIdx}-opt${chosenOptIdx}`,
              );
              await tx.surveyAnswer.upsert({
                where: { id: answerId },
                create: {
                  id: answerId,
                  responseId,
                  questionId,
                  optionId,
                  createdAt: submittedAt,
                  updatedAt: submittedAt,
                },
                update: {},
              });
            }
          } else {
            const chosenOptIdx = (graduateIdx + qIdx) % optCount;
            const optionId = deterministicUuid(
              `${owner.prefix}-${def.keySuffix}-q${qIdx}-opt${chosenOptIdx}`,
            );
            const answerId = deterministicUuid(
              `ans-${owner.prefix}-${def.keySuffix}-${graduateIdx}-q${qIdx}`,
            );
            await tx.surveyAnswer.upsert({
              where: { id: answerId },
              create: {
                id: answerId,
                responseId,
                questionId,
                optionId,
                createdAt: submittedAt,
                updatedAt: submittedAt,
              },
              update: {},
            });
          }
        }
      }
    }
  }

  return totalItemsCreated;
}

export async function runFormalSurveysCli(): Promise<void> {
  const prisma = createSeedClient();
  try {
    console.log('Inicializando titulados y encuestas formales...');
    const count = await prisma.$transaction(
      async (tx) => {
        return seedFormalSurveysAndStudents(tx);
      },
      { maxWait: 15_000, timeout: 180_000 },
    );
    console.log(
      `✓ Seed de encuestas formales completado exitosamente. Encuestas creadas/actualizadas: ${count}`,
    );
  } catch (error) {
    console.error('Error ejecutando seed formal de encuestas:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runFormalSurveysCli();
}
