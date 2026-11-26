import type { ApiResponseOptions } from '@nestjs/swagger';
import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception.js';
import { COMPANY_VALIDATION_MESSAGES } from './company-profile.constants.js';
import { FEATURED_COMPANIES_LIMIT } from './featured-companies.constants.js';

const EXAMPLE_COMPANY_ID = '5f0c8a52-3d4b-4c1e-9a7f-2b6d8e1c4a90';

const invalidCompanyId = new RequestValidationException([
  {
    field: 'companyId',
    message: COMPANY_VALIDATION_MESSAGES.INVALID_COMPANY_ID,
  },
]);
const forbiddenRole = new ForbiddenRoleException();
const otherCompany = new ForbiddenRoleException(
  'No tienes acceso a esta empresa',
);
const companyNotFound = new CompanyNotFoundException();

const nullableString = (example: string) =>
  ({ type: 'string', nullable: true, example }) as const;

export const GET_COMPANY_PROFILE_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description:
    'Perfil de la empresa. Los datos de contacto son null si la empresa todavía no tiene perfil registrado',
  schema: {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data'],
    properties: {
      statusCode: { type: 'integer', example: 200 },
      ok: { type: 'boolean', example: true },
      detail: { type: 'string', example: 'Operación exitosa' },
      data: {
        type: 'object',
        required: [
          'id',
          'name',
          'description',
          'sector',
          'city',
          'phone',
          'email',
          'website',
          'logoUrl',
        ],
        properties: {
          id: { type: 'string', format: 'uuid', example: EXAMPLE_COMPANY_ID },
          name: { type: 'string', example: 'Tech Andina S.R.L.' },
          description: nullableString('Desarrollo de software a medida.'),
          sector: nullableString('Software'),
          city: nullableString('Cochabamba'),
          phone: nullableString('44251234'),
          email: nullableString('contacto@techandina.bo'),
          website: nullableString('https://techandina.bo'),
          logoUrl: {
            type: 'string',
            nullable: true,
            description:
              'Ruta del logo relativa a la API; null si la empresa no subió logo',
            example: `/companies/${EXAMPLE_COMPANY_ID}/logo`,
          },
        },
      },
    },
  },
};

export const GET_COMPANY_PROFILE_ERROR_RESPONSES: ApiResponseOptions[] = [
  {
    status: 400,
    description: 'Identificador con formato inválido (`VALIDATION_ERROR`)',
    content: {
      'application/json': {
        schema: API_ERROR_SCHEMA,
        example: {
          statusCode: 400,
          ok: false,
          code: invalidCompanyId.code,
          detail: invalidCompanyId.message,
          data: invalidCompanyId.data,
        },
      },
    },
  },
  {
    status: 403,
    description:
      'Rol distinto de empresa o empresa ajena a la sesión (`FORBIDDEN_ROLE`)',
    content: {
      'application/json': {
        schema: API_ERROR_SCHEMA,
        examples: {
          forbiddenRole: {
            summary: 'Rol no permitido',
            value: {
              statusCode: 403,
              ok: false,
              code: forbiddenRole.code,
              detail: forbiddenRole.message,
              data: null,
            },
          },
          otherCompany: {
            summary: 'Empresa ajena',
            value: {
              statusCode: 403,
              ok: false,
              code: otherCompany.code,
              detail: otherCompany.message,
              data: null,
            },
          },
        },
      },
    },
  },
  {
    status: 404,
    description: 'La empresa no existe (`COMPANY_NOT_FOUND`)',
    content: {
      'application/json': {
        schema: API_ERROR_SCHEMA,
        example: {
          statusCode: 404,
          ok: false,
          code: companyNotFound.code,
          detail: companyNotFound.message,
          data: null,
        },
      },
    },
  },
];

export const LIST_FEATURED_COMPANIES_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: `Hasta ${FEATURED_COMPANIES_LIMIT} empresas con vacantes publicadas y vigentes, de la que tiene más vacantes a la que tiene menos; los empates se ordenan por nombre. Lista vacía si ninguna empresa tiene vacantes vigentes`,
  schema: {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data'],
    properties: {
      statusCode: { type: 'integer', example: 200 },
      ok: { type: 'boolean', example: true },
      detail: { type: 'string', example: 'Operación exitosa' },
      data: {
        type: 'array',
        maxItems: FEATURED_COMPANIES_LIMIT,
        items: {
          type: 'object',
          required: [
            'id',
            'name',
            'sector',
            'description',
            'logoUrl',
            'activeVacanciesCount',
          ],
          properties: {
            id: { type: 'string', format: 'uuid', example: EXAMPLE_COMPANY_ID },
            name: { type: 'string', example: 'Tech Andina S.R.L.' },
            sector: nullableString('Software'),
            description: nullableString('Desarrollo de software a medida.'),
            logoUrl: {
              type: 'string',
              nullable: true,
              description:
                'Ruta del logo relativa a la API; null si la empresa no subió logo',
              example: `/companies/${EXAMPLE_COMPANY_ID}/logo`,
            },
            activeVacanciesCount: { type: 'integer', minimum: 1, example: 3 },
          },
        },
      },
    },
  },
};
