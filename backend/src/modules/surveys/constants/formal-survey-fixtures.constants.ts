import { SurveyQuestionType } from '../types/survey.enum.js';
import type { FormalGraduateDefinition } from '../types/formal-graduate-definition.type.js';
import type { FormalSurveyDefinition } from '../types/formal-survey-definition.type.js';

export const FORMAL_SEED_PASSWORD_HASH =
  '$2b$10$SGuj5IRujU5usBlVbAoDReuM2PeOD74IjT/3GGnWk2FoiCVCKeWxm';

export const FORMAL_SECONDARY_ADMIN_EMAIL = 'admin.2@umssy.test';

export const FORMAL_SURVEY_OWNERS = ['admin1', 'admin2'] as const;

export const FORMAL_GRADUATES: readonly FormalGraduateDefinition[] = [
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

export const FORMAL_SURVEY_DEFINITIONS: readonly FormalSurveyDefinition[] = [
  {
    keySuffix: 's1-competencias-5p',
    title: 'Evaluación de Competencias Profesionales e Inserción Laboral',
    description:
      'Estudio institucional sobre la pertinencia y aplicación de las competencias adquiridas durante la formación universitaria en el entorno laboral actual.',
    questionCount: 5,
    computeSchedule: (anchor: Date) => ({
      opensAt: new Date(anchor.getTime() - 14 * 24 * 60 * 60 * 1000),
      closesAt: new Date(anchor.getTime() - 5 * 60 * 1000),
      closingSoonNotifiedAt: new Date(
        anchor.getTime() - 3 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000,
      ),
      closedNotifiedAt: null,
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

  {
    keySuffix: 's2-trayectoria-6p',
    title: 'Seguimiento de Trayectoria Profesional y Empleabilidad Temprana',
    description:
      'Relevamiento de datos sobre el tiempo de inserción en el mercado, condiciones contractuales y evolución salarial de los titulados.',
    questionCount: 6,
    computeSchedule: (anchor: Date) => ({
      opensAt: new Date(anchor.getTime() - 7 * 24 * 60 * 60 * 1000),
      closesAt: new Date(
        anchor.getTime() + 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000,
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

  {
    keySuffix: 's3-actualizacion-7p',
    title: 'Impacto Curricular y Actualización Tecnológica del Egresado',
    description:
      'Análisis curricular continuo para identificar brechas tecnológicas emergentes y áreas de fortalecimiento en los planes de estudio.',
    questionCount: 7,
    computeSchedule: (anchor: Date) => {
      const tomorrow7am = new Date(anchor);
      tomorrow7am.setDate(tomorrow7am.getDate() + 1);
      tomorrow7am.setHours(7, 0, 0, 0);
      return {
        opensAt: new Date(anchor.getTime() - 5 * 24 * 60 * 60 * 1000),
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

  {
    keySuffix: 's4-liderazgo-8p',
    title: 'Calidad de Formación Integral, Liderazgo y Posgrado',
    description:
      'Evaluación de habilidades blandas, capacidades de liderazgo, ética profesional y proyección hacia estudios de posgrado.',
    questionCount: 8,
    computeSchedule: (anchor: Date) => {
      const dayAfterTomorrow1pm = new Date(anchor);
      dayAfterTomorrow1pm.setDate(dayAfterTomorrow1pm.getDate() + 2);
      dayAfterTomorrow1pm.setHours(13, 0, 0, 0);
      return {
        opensAt: new Date(anchor.getTime() - 3 * 24 * 60 * 60 * 1000),
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

export const FORMAL_GRADUATE_ANSWERED_SURVEY_INDEXES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [0, 1, 3],
  [0, 2, 3],
  [1, 2, 3],
  [0, 1, 2],
  [0, 1, 3],
  [0, 2, 3],
  [1, 2, 3],
  [0, 1, 2],
  [0, 1, 3],
];
