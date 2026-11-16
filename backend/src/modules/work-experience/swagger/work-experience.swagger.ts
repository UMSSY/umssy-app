import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { API_EXAMPLE_IDS } from '../../../common/constants/api-example-ids.constants.js';
import { SUCCESS_DETAIL_OK } from '../../../common/constants/api-errors.constants.js';
import {
  apiAuthResponses,
  apiErrorResponse,
} from '../../../common/decorators/api-error-response.decorator.js';
import { apiSuccessResponse } from '../../../common/decorators/api-success-response.decorator.js';
import {
  apiArray,
  apiBoolean,
  apiDate,
  apiDateTime,
  apiNullable,
  apiObject,
  apiString,
  apiUuid,
  type ApiSchema,
} from '../../../common/utils/api-schema.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { createWorkExperienceSchema } from '../requests/create-work-experience.request.js';
import { updateWorkExperienceSchema } from '../requests/update-work-experience.request.js';

const WORK_EXPERIENCE_ID_PARAM = {
  name: 'id',
  type: String,
  format: 'uuid',
  description: 'Identificador de la experiencia laboral',
  example: API_EXAMPLE_IDS.workExperience,
} as const;

const WORK_EXPERIENCE_NOT_FOUND_ERROR = {
  code: 'WORK_EXPERIENCE_NOT_FOUND',
  detail: 'Work experience not found',
};

const PERIOD_ERRORS = [
  {
    code: 'INVALID_WORK_EXPERIENCE_DATE_RANGE',
    detail: 'endDate cannot be earlier than startDate',
  },
  {
    code: 'WORK_EXPERIENCE_END_DATE_REQUIRED',
    detail: 'endDate is required when isCurrent is false',
  },
];

const workExperienceSchema: ApiSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.workExperience),
  companyName: apiString('Tecnología Andina S.R.L.'),
  position: apiString('Desarrollador Backend'),
  startDate: apiDate('2024-03-01'),
  endDate: apiNullable(apiDate('2025-06-30')),
  isCurrent: apiBoolean(false),
  description: apiNullable(
    apiString('Desarrollo de APIs REST con NestJS y PostgreSQL.'),
  ),
  createdAt: apiDateTime('2026-11-10T14:32:00.000Z'),
  updatedAt: apiDateTime('2026-11-10T14:32:00.000Z'),
});

const CREATE_EXAMPLE = {
  companyName: 'Tecnología Andina S.R.L.',
  position: 'Desarrollador Backend',
  startDate: '2024-03-01',
  endDate: '2025-06-30',
  isCurrent: false,
  description: 'Desarrollo de APIs REST con NestJS y PostgreSQL.',
};

const UPDATE_EXAMPLE = { position: 'Desarrollador Backend Senior' };

export function apiListWorkExperiences() {
  return applyDecorators(
    ApiOperation({
      operationId: 'listWorkExperiences',
      summary: 'Lista las experiencias laborales de la persona autenticada',
      description:
        'Devuelve todas las experiencias de la persona, sin paginación: primero el trabajo actual y luego por fecha de inicio, de la más reciente a la más antigua. Acepta cualquier rol autenticado.',
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Experiencias laborales de la persona',
      data: apiArray(workExperienceSchema),
      detail: SUCCESS_DETAIL_OK,
    }),
    apiAuthResponses(),
  );
}

export function apiCreateWorkExperience() {
  return applyDecorators(
    ApiOperation({
      operationId: 'createWorkExperience',
      summary: 'Registra una experiencia laboral',
      description:
        'Crea la experiencia; la empresa se busca por su nombre exacto o se crea. Las fechas deben estar entre 1950-01-01 y hoy (hora de Bolivia). Si `isCurrent` es `true` se ignora `endDate`; si es `false`, `endDate` es obligatoria y no puede ser anterior a `startDate`. Al responder, las habilidades detectadas del perfil ya están actualizadas. Acepta cualquier rol autenticado.',
    }),
    ApiBody(toApiBody(createWorkExperienceSchema, CREATE_EXAMPLE)),
    apiSuccessResponse({
      status: 201,
      description: 'Experiencia registrada',
      data: workExperienceSchema,
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 400,
      description: 'Algún dato no es válido o el periodo es inconsistente',
      validation: [
        {
          field: 'description',
          message: 'La descripción de funciones es obligatoria',
        },
      ],
      errors: PERIOD_ERRORS,
    }),
    apiAuthResponses(),
  );
}

export function apiUpdateWorkExperience() {
  return applyDecorators(
    ApiOperation({
      operationId: 'updateWorkExperience',
      summary: 'Actualiza una experiencia laboral',
      description:
        'Cambia solo los campos enviados; se requiere al menos uno. Valen las mismas reglas de fechas que al crear. Al responder, las habilidades detectadas del perfil ya están actualizadas. Acepta cualquier rol autenticado.',
    }),
    ApiParam(WORK_EXPERIENCE_ID_PARAM),
    ApiBody(toApiBody(updateWorkExperienceSchema, UPDATE_EXAMPLE)),
    apiSuccessResponse({
      status: 200,
      description: 'Experiencia actualizada',
      data: workExperienceSchema,
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 400,
      description:
        'Algún dato o el identificador no son válidos, o el periodo es inconsistente',
      validation: [
        {
          field: '',
          message: 'At least one work experience field is required',
        },
      ],
      errors: PERIOD_ERRORS,
    }),
    apiErrorResponse({
      status: 404,
      description: 'La experiencia no existe o pertenece a otra persona',
      errors: [WORK_EXPERIENCE_NOT_FOUND_ERROR],
    }),
    apiErrorResponse({
      status: 409,
      description: 'Las fechas cambiaron mientras se actualizaba',
      errors: [
        {
          code: 'WORK_EXPERIENCE_UPDATE_CONFLICT',
          detail: 'Work experience dates changed during the update',
        },
      ],
    }),
    apiAuthResponses(),
  );
}

export function apiDeleteWorkExperience() {
  return applyDecorators(
    ApiOperation({
      operationId: 'deleteWorkExperience',
      summary: 'Elimina una experiencia laboral',
      description:
        'Elimina la experiencia. Las habilidades detectadas que solo esa experiencia respaldaba se eliminan del perfil; las agregadas a mano se conservan. Acepta cualquier rol autenticado.',
    }),
    ApiParam(WORK_EXPERIENCE_ID_PARAM),
    apiSuccessResponse({
      status: 200,
      description: 'Experiencia eliminada; `data` es `null`',
      data: apiNullable({ type: 'object' }),
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 400,
      description: 'El identificador no es un UUID',
      validation: [{ field: '', message: 'Invalid UUID' }],
    }),
    apiErrorResponse({
      status: 404,
      description: 'La experiencia no existe o pertenece a otra persona',
      errors: [WORK_EXPERIENCE_NOT_FOUND_ERROR],
    }),
    apiAuthResponses(),
  );
}
