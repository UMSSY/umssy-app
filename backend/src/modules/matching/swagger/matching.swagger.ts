import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { API_EXAMPLE_IDS } from '../../../common/constants/api-example-ids.constants.js';
import {
  apiAuthResponses,
  apiErrorResponse,
} from '../../../common/decorators/api-error-response.decorator.js';
import { apiSuccessResponse } from '../../../common/decorators/api-success-response.decorator.js';
import {
  apiArray,
  apiBoolean,
  apiDateTime,
  apiEnum,
  apiExampleOf,
  apiInteger,
  apiNullable,
  apiObject,
  apiString,
  apiUuid,
} from '../../../common/utils/api-schema.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { JobOfferModality } from '../../job-offers/types/job-offer.enum.js';
import { analyzeExperienceBodySchema } from '../requests/analyze-experience.schema.js';
import { jobApplicationConsentsSchema } from '../requests/job-application-consents.request.js';
import { requirementTermsBodySchema } from '../requests/requirement-terms.schema.js';

export const APPLICANT_ROLES = ['titulado', 'estudiante'] as const;
export const COMPANY_ROLES = ['empresa'] as const;

const JOB_OFFER_ID_PARAM = {
  name: 'id',
  type: String,
  format: 'uuid',
  description: 'Identificador de la vacante',
  example: API_EXAMPLE_IDS.jobOffer,
} as const;

const JOB_OFFER_UNAVAILABLE_ERROR = {
  code: 'JOB_OFFER_UNAVAILABLE',
  detail: 'La vacante no existe o no está disponible.',
};

const MODALITIES = Object.values(JobOfferModality);

const jobApplicationSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.application),
  jobOfferId: apiUuid(API_EXAMPLE_IDS.jobOffer),
  jobTitle: apiString('Desarrollador Backend Junior'),
  companyName: apiString('Tecnología Andina S.R.L.'),
  appliedAt: apiDateTime('2026-11-10T14:32:00.000Z'),
  status: apiString('En revisión'),
});

const myJobApplicationSchema = apiObject({
  hasApplied: apiBoolean(true),
  application: apiNullable(
    jobApplicationSchema,
    apiExampleOf(jobApplicationSchema),
  ),
});

const applicantsSchema = apiObject({
  jobOfferId: apiUuid(API_EXAMPLE_IDS.jobOffer),
  jobTitle: apiString('Desarrollador Backend Junior'),
  total: apiInteger(1, { minimum: 0 }),
  applicants: apiArray(
    apiObject({
      id: apiUuid(API_EXAMPLE_IDS.application),
      userId: apiUuid(API_EXAMPLE_IDS.user),
      fullName: apiString('Ana Rojas Vargas'),
      email: apiString('ana.rojas@example.com', { format: 'email' }),
      headline: apiNullable(apiString('Ingeniera de Sistemas')),
      appliedAt: apiDateTime('2026-11-10T14:32:00.000Z'),
      status: apiString('En revisión'),
    }),
  ),
});

const jobMatchSchema = apiObject({
  jobOfferId: apiUuid(API_EXAMPLE_IDS.jobOffer),
  title: apiString('Desarrollador Backend Junior'),
  companyName: apiString('Tecnología Andina S.R.L.'),
  modality: apiEnum(MODALITIES, JobOfferModality.HYBRID),
  description: apiString('Desarrollo y mantenimiento de APIs REST.'),
  publishedAt: apiDateTime('2026-11-02T13:00:00.000Z'),
  expiresAt: apiNullable(apiDateTime('2026-12-02T13:00:00.000Z')),
  score: apiInteger(82, { minimum: 0, maximum: 100 }),
  hasPendingRequirements: apiBoolean(true),
  requirements: apiArray(
    apiObject({
      name: apiString('NestJS'),
      status: apiEnum(['Cumple', 'Pendiente'], 'Cumple'),
      category: apiEnum(['skill', 'academic', 'other'], 'skill'),
    }),
  ),
});

const recommendationsSchema = apiObject({
  isProfileComplete: apiBoolean(true),
  items: apiArray(
    apiObject({
      jobOfferId: apiUuid(API_EXAMPLE_IDS.jobOffer),
      title: apiString('Desarrollador Backend Junior'),
      companyName: apiString('Tecnología Andina S.R.L.'),
      modality: apiEnum(MODALITIES, JobOfferModality.HYBRID),
      locationUrl: apiString('https://maps.app.goo.gl/AbCdEf123456', {
        format: 'uri',
      }),
      publishedAt: apiDateTime('2026-11-02T13:00:00.000Z'),
      expiresAt: apiNullable(apiDateTime('2026-12-02T13:00:00.000Z')),
      score: apiInteger(82, { minimum: 1, maximum: 100 }),
      skills: apiArray(apiString('NestJS')),
      matchedSkills: apiArray(apiString('NestJS')),
    }),
  ),
});

const detectedSkillSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.skill),
  name: apiString('NestJS'),
});

const experienceAnalysisSchema = apiObject({
  experienceId: apiUuid(API_EXAMPLE_IDS.workExperience),
  skills: apiArray(detectedSkillSchema),
  processingTimeMs: apiInteger(12, { minimum: 0 }),
});

const EXPERIENCE_TEXT_EXAMPLE = {
  text: 'Desarrollé APIs REST con NestJS y PostgreSQL, y automaticé pruebas con Vitest.',
};

export function apiApplyToJobOffer() {
  return applyDecorators(
    ApiOperation({
      operationId: 'applyToJobOffer',
      summary: 'Postula a la persona autenticada a una vacante publicada',
      description:
        'Registra la postulación en estado "En revisión" y guarda en la misma transacción los tres consentimientos, que deben ser `true`: `consent` (revisión por el reclutador), `consentCv` (CV actual) y `consentContact` (información de contacto). Una persona solo puede tener una postulación por vacante. Roles: titulado, estudiante.',
    }),
    ApiParam(JOB_OFFER_ID_PARAM),
    ApiBody(
      toApiBody(jobApplicationConsentsSchema, {
        consent: true,
        consentCv: true,
        consentContact: true,
      }),
    ),
    apiSuccessResponse({
      status: 201,
      description: 'Postulación registrada en estado "En revisión"',
      data: jobApplicationSchema,
    }),
    apiErrorResponse({
      status: 400,
      description: 'Falta algún consentimiento o hay campos desconocidos',
      validation: [
        { field: 'consent', message: 'Invalid input: expected true' },
      ],
    }),
    apiErrorResponse({
      status: 404,
      description:
        'La vacante no existe, no está publicada o ya venció. También responde así un identificador con formato inválido',
      errors: [JOB_OFFER_UNAVAILABLE_ERROR],
    }),
    apiErrorResponse({
      status: 409,
      description: 'La persona ya se postuló a esta vacante',
      errors: [
        {
          code: 'DUPLICATE_JOB_APPLICATION',
          detail: 'Ya te postulaste a esta vacante.',
        },
      ],
    }),
    apiErrorResponse({
      status: 500,
      description: 'Falta el estado inicial "En revisión" en el catálogo',
      errors: [
        {
          code: 'JOB_APPLICATION_STATUS_MISSING',
          detail: 'No se encontró el estado inicial de la postulación.',
        },
      ],
    }),
    apiAuthResponses({ roles: APPLICANT_ROLES }),
  );
}

export function apiGetMyJobApplication() {
  return applyDecorators(
    ApiOperation({
      operationId: 'getMyJobApplication',
      summary: 'Indica si la persona autenticada ya se postuló a la vacante',
      description:
        'Devuelve `hasApplied` y, si existe, la postulación de la persona a esa vacante (incluida una retirada). La interfaz lo usa para decidir si muestra el botón de postular. Roles: titulado, estudiante.',
    }),
    ApiParam(JOB_OFFER_ID_PARAM),
    apiSuccessResponse({
      status: 200,
      description:
        'Postulación de la persona, o `application: null` si aún no se postuló',
      data: myJobApplicationSchema,
    }),
    apiErrorResponse({
      status: 404,
      description: 'El identificador de la vacante tiene un formato inválido',
      errors: [JOB_OFFER_UNAVAILABLE_ERROR],
    }),
    apiAuthResponses({ roles: APPLICANT_ROLES }),
  );
}

export function apiListJobOfferApplicants() {
  return applyDecorators(
    ApiOperation({
      operationId: 'listJobOfferApplicants',
      summary:
        'Lista cuántos y quiénes se postularon a una vacante de la empresa',
      description:
        'Devuelve el total de postulantes y su detalle, del más reciente al más antiguo. La empresa del token debe coincidir con `companyId` y la vacante debe pertenecerle. No tiene paginación. Roles: empresa.',
    }),
    ApiParam({
      name: 'companyId',
      type: String,
      format: 'uuid',
      description: 'Identificador de la empresa',
      example: API_EXAMPLE_IDS.company,
    }),
    ApiParam({
      name: 'jobOfferId',
      type: String,
      format: 'uuid',
      description: 'Identificador de la vacante',
      example: API_EXAMPLE_IDS.jobOffer,
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Total de postulantes y su detalle',
      data: applicantsSchema,
    }),
    apiErrorResponse({
      status: 404,
      description:
        'La vacante no existe o no pertenece a la empresa. También responde así un identificador con formato inválido',
      errors: [JOB_OFFER_UNAVAILABLE_ERROR],
    }),
    apiAuthResponses({
      roles: COMPANY_ROLES,
      forbidden: [
        { code: 'FORBIDDEN_ROLE', detail: 'No tienes acceso a esta empresa' },
      ],
    }),
  );
}

export function apiGetJobOfferMatch() {
  return applyDecorators(
    ApiOperation({
      operationId: 'getJobOfferMatch',
      summary: 'Calcula la afinidad de la persona autenticada con una vacante',
      description:
        'Devuelve el puntaje de afinidad (0 a 100) y cada requisito de la vacante con su estado "Cumple" o "Pendiente", agrupado por categoría (`skill`, `academic`, `other`). El puntaje es una guía: depende de las habilidades del perfil frente a las de la vacante. Solo para vacantes publicadas y vigentes. Roles: titulado, estudiante.',
    }),
    ApiParam(JOB_OFFER_ID_PARAM),
    apiSuccessResponse({
      status: 200,
      description: 'Afinidad y requisitos de la vacante',
      data: jobMatchSchema,
    }),
    apiErrorResponse({
      status: 400,
      description: 'El identificador de la vacante no es un UUID',
      validation: [
        {
          field: 'id',
          message: 'El identificador de la vacante no es valido',
        },
      ],
    }),
    apiErrorResponse({
      status: 404,
      description: 'La vacante no existe, no está publicada o ya venció',
      errors: [
        {
          code: 'JOB_OFFER_NOT_AVAILABLE',
          detail: 'La vacante no existe o no está disponible',
        },
      ],
    }),
    apiAuthResponses({ roles: APPLICANT_ROLES }),
  );
}

export function apiListJobRecommendations() {
  return applyDecorators(
    ApiOperation({
      operationId: 'listJobRecommendations',
      summary:
        'Lista las vacantes recomendadas según las habilidades del perfil',
      description:
        'Devuelve las vacantes publicadas y vigentes con afinidad mayor a 0, ordenadas por afinidad. Si el perfil aún no tiene habilidades, `isProfileComplete` es `false` y `items` va vacío. No tiene paginación. Roles: titulado, estudiante.',
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Vacantes recomendadas con su afinidad',
      data: recommendationsSchema,
    }),
    apiAuthResponses({ roles: APPLICANT_ROLES }),
  );
}

export function apiAnalyzeExperienceSkills() {
  return applyDecorators(
    ApiOperation({
      operationId: 'analyzeWorkExperienceSkills',
      summary: 'Detecta y guarda las habilidades de una experiencia laboral',
      description:
        'Analiza el texto recibido, busca habilidades del catálogo y reemplaza las habilidades detectadas de esa experiencia. Si `text` no se envía se analiza como texto vacío. Acepta cualquier rol autenticado.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      format: 'uuid',
      description: 'Identificador de la experiencia laboral',
      example: API_EXAMPLE_IDS.workExperience,
    }),
    ApiBody(toApiBody(analyzeExperienceBodySchema, EXPERIENCE_TEXT_EXAMPLE)),
    apiSuccessResponse({
      status: 200,
      description: 'Habilidades detectadas y tiempo de proceso',
      data: experienceAnalysisSchema,
      detail: 'OK',
    }),
    apiErrorResponse({
      status: 400,
      description: 'El identificador o el texto no son válidos',
      validation: [
        {
          field: 'text',
          message: 'El texto no puede superar los 5000 caracteres',
        },
      ],
    }),
    apiErrorResponse({
      status: 404,
      description: 'La experiencia no existe o pertenece a otra persona',
      errors: [
        {
          code: 'WORK_EXPERIENCE_NOT_FOUND',
          detail: 'Work experience not found',
        },
      ],
    }),
    apiAuthResponses(),
  );
}

export function apiPreviewExperienceSkills() {
  return applyDecorators(
    ApiOperation({
      operationId: 'previewWorkExperienceSkills',
      summary: 'Muestra las habilidades que se detectarían en una experiencia',
      description:
        'Igual que el análisis, pero no guarda nada: sirve para sugerir habilidades mientras la persona escribe la descripción. Acepta cualquier rol autenticado.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      format: 'uuid',
      description: 'Identificador de la experiencia laboral',
      example: API_EXAMPLE_IDS.workExperience,
    }),
    ApiBody(toApiBody(analyzeExperienceBodySchema, EXPERIENCE_TEXT_EXAMPLE)),
    apiSuccessResponse({
      status: 200,
      description: 'Habilidades detectadas y tiempo de proceso',
      data: experienceAnalysisSchema,
      detail: 'OK',
    }),
    apiErrorResponse({
      status: 400,
      description: 'El identificador o el texto no son válidos',
      validation: [
        {
          field: 'text',
          message: 'El texto no puede superar los 5000 caracteres',
        },
      ],
    }),
    apiErrorResponse({
      status: 404,
      description: 'La experiencia no existe o pertenece a otra persona',
      errors: [
        {
          code: 'WORK_EXPERIENCE_NOT_FOUND',
          detail: 'Work experience not found',
        },
      ],
    }),
    apiAuthResponses(),
  );
}

export function apiExtractRequirementTerms() {
  return applyDecorators(
    ApiOperation({
      operationId: 'extractRequirementTerms',
      summary:
        'Detecta habilidades del catálogo en el texto de requisitos de una vacante',
      description:
        'Recibe la descripción que escribe la empresa y devuelve las habilidades del catálogo que reconoce, sin guardar nada. Un texto vacío o sin coincidencias devuelve una lista vacía. Acepta cualquier rol autenticado.',
    }),
    ApiBody(
      toApiBody(requirementTermsBodySchema, {
        text: 'Buscamos a alguien con experiencia en NestJS, PostgreSQL y Docker.',
      }),
    ),
    apiSuccessResponse({
      status: 200,
      description: 'Habilidades del catálogo reconocidas en el texto',
      data: apiArray(detectedSkillSchema),
    }),
    apiErrorResponse({
      status: 400,
      description: 'El texto falta o supera el límite',
      validation: [
        {
          field: 'text',
          message: 'El texto no puede superar los 5000 caracteres',
        },
      ],
    }),
    apiAuthResponses(),
  );
}
