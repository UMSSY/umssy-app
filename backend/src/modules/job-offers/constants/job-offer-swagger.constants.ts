import type { ApiResponseOptions } from '@nestjs/swagger';
import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import {
  CompanyNotFoundException,
  DuplicateJobOfferSkillsException,
  JobOfferCatalogNotFoundException,
  JobOfferExpiryInPastException,
  JobOfferNotClosableException,
  JobOfferNotFoundException,
  JobOfferSkillNotFoundException,
  TooManyJobOfferSkillsException,
} from '../exceptions/index.js';
import type { JobOfferErrorExample } from '../types/job-offer-error-example.type.js';
import { JOB_OFFER_VALIDATION_MESSAGES } from './job-offer.constants.js';

const EXAMPLE_COMPANY_ID = '5f0c8a52-3d4b-4c1e-9a7f-2b6d8e1c4a90';
const EXAMPLE_JOB_OFFER_ID = '9b1d7e3a-6c2f-4e8b-a5d1-0f4c3b2a7e61';

const JOB_OFFER_RESPONSE_SCHEMA = {
  type: 'object',
  required: [
    'id',
    'title',
    'description',
    'category',
    'modality',
    'contractType',
    'status',
    'positionsAvailable',
    'salaryRange',
    'languages',
    'locationUrl',
    'expiresAt',
    'publishedAt',
    'createdAt',
    'company',
    'skills',
    'applicantsCount',
  ],
  properties: {
    id: { type: 'string', format: 'uuid', example: EXAMPLE_JOB_OFFER_ID },
    title: { type: 'string', example: 'Desarrollador Backend' },
    description: { type: 'string', example: 'Desarrollo de servicios REST.' },
    category: { type: 'string', example: 'Tecnología' },
    modality: { type: 'string', example: 'Remoto' },
    contractType: { type: 'string', example: 'Tiempo completo' },
    status: { type: 'string', enum: ['Cerrada'], example: 'Cerrada' },
    positionsAvailable: { type: 'integer', example: 2 },
    salaryRange: { type: 'string', example: 'Bs 5.000 - 8.000' },
    languages: { type: 'string', example: 'Español, Inglés' },
    locationUrl: {
      type: 'string',
      example: 'https://maps.app.goo.gl/abc123',
    },
    expiresAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      example: '2026-12-01T03:59:00.000Z',
    },
    publishedAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-11-10T14:00:00.000Z',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-11-10T14:00:00.000Z',
    },
    company: {
      type: 'object',
      required: ['id', 'name'],
      properties: {
        id: { type: 'string', format: 'uuid', example: EXAMPLE_COMPANY_ID },
        name: { type: 'string', example: 'Empresa Demo' },
      },
    },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'NestJS' },
        },
      },
    },
    applicantsCount: { type: 'integer', example: 4 },
  },
};

export const CLOSE_JOB_OFFER_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Vacante cerrada; su estado pasa a Cerrada',
  schema: {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data'],
    properties: {
      statusCode: { type: 'integer', example: 200 },
      ok: { type: 'boolean', example: true },
      detail: { type: 'string', example: 'Operación exitosa' },
      data: JOB_OFFER_RESPONSE_SCHEMA,
    },
  },
};

function errorResponse(
  status: number,
  description: string,
  examples: Record<string, JobOfferErrorExample>,
): ApiResponseOptions {
  const codes = [
    ...new Set(Object.values(examples).map(({ error }) => error.code)),
  ];
  return {
    status,
    description,
    content: {
      'application/json': {
        schema: {
          allOf: [
            API_ERROR_SCHEMA,
            {
              type: 'object',
              properties: { code: { type: 'string', enum: codes } },
            },
          ],
        },
        examples: Object.fromEntries(
          Object.entries(examples).map(([name, { summary, error }]) => [
            name,
            {
              summary,
              value: {
                statusCode: status,
                ok: false,
                code: error.code,
                detail: error.message,
                data: error.data ?? null,
              },
            },
          ]),
        ),
      },
    },
  };
}

export const CLOSE_JOB_OFFER_ERROR_RESPONSES: ApiResponseOptions[] = [
  errorResponse(400, 'Identificador con formato inválido (`VALIDATION_ERROR`)', {
    invalidJobOfferId: {
      summary: 'jobOfferId no es un UUID',
      error: new RequestValidationException([
        {
          field: 'jobOfferId',
          message: JOB_OFFER_VALIDATION_MESSAGES.INVALID_JOB_OFFER_ID,
        },
      ]),
    },
  }),
  errorResponse(
    403,
    'Rol distinto de empresa o empresa ajena a la sesión (`FORBIDDEN_ROLE`)',
    {
      forbiddenRole: {
        summary: 'Rol no permitido',
        error: new ForbiddenRoleException(),
      },
      otherCompany: {
        summary: 'Empresa ajena',
        error: new ForbiddenRoleException('No tienes acceso a esta empresa'),
      },
    },
  ),
  errorResponse(
    404,
    'La empresa no existe (`COMPANY_NOT_FOUND`) o la vacante no es de la empresa (`JOB_OFFER_NOT_FOUND`)',
    {
      companyNotFound: {
        summary: 'Empresa inexistente',
        error: new CompanyNotFoundException(),
      },
      jobOfferNotFound: {
        summary: 'Vacante inexistente o ajena',
        error: new JobOfferNotFoundException(),
      },
    },
  ),
  errorResponse(
    409,
    'La vacante ya está cerrada o eliminada (`JOB_OFFER_NOT_CLOSABLE`)',
    {
      notClosable: {
        summary: 'Vacante no publicada',
        error: new JobOfferNotClosableException(),
      },
    },
  ),
  errorResponse(
    422,
    'Falta el estado Cerrada en el catálogo (`JOB_OFFER_CATALOG_NOT_FOUND`)',
    {
      catalogNotFound: {
        summary: 'Estado inexistente',
        error: new JobOfferCatalogNotFoundException('estado'),
      },
    },
  ),
];

export const CREATE_JOB_OFFER_UNPROCESSABLE_RESPONSE: ApiResponseOptions =
  errorResponse(
    422,
    'La fecha de cierre no es posterior al momento de publicar, una habilidad no es válida o un valor de catálogo no existe',
    {
      expiryInPast: {
        summary: 'Fecha de cierre pasada',
        error: new JobOfferExpiryInPastException(),
      },
      skillNotFound: {
        summary: 'Habilidad inexistente',
        error: new JobOfferSkillNotFoundException(),
      },
      duplicateSkills: {
        summary: 'Habilidades duplicadas',
        error: new DuplicateJobOfferSkillsException(),
      },
      tooManySkills: {
        summary: 'Demasiadas habilidades',
        error: new TooManyJobOfferSkillsException(),
      },
      catalogNotFound: {
        summary: 'Modalidad, tipo de contrato o estado inexistente',
        error: new JobOfferCatalogNotFoundException('modalidad'),
      },
    },
  );
