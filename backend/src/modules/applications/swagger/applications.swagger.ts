import { applyDecorators } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { API_EXAMPLE_IDS } from '../../../common/constants/api-example-ids.constants.js';
import {
  apiAuthResponses,
  apiErrorResponse,
} from '../../../common/decorators/api-error-response.decorator.js';
import { apiSuccessResponse } from '../../../common/decorators/api-success-response.decorator.js';
import {
  apiArray,
  apiDateTime,
  apiEnum,
  apiInteger,
  apiObject,
  apiString,
  apiUuid,
} from '../../../common/utils/api-schema.js';
import {
  APPLICATION_SORT_FIELDS,
  APPLICATION_SORT_ORDERS,
} from '../requests/find-applications.request.js';
import { ApplicationStatus } from '../types/applications.types.js';

export const APPLICANT_ROLES = ['titulado', 'estudiante'] as const;

const APPLICATION_ID_PARAM = {
  name: 'id',
  type: String,
  format: 'uuid',
  description: 'Identificador de la postulación',
  example: API_EXAMPLE_IDS.application,
} as const;

const APPLICATION_NOT_FOUND_ERROR = {
  code: 'APPLICATION_NOT_FOUND',
  detail: 'La postulación no existe',
};

const APPLICATION_FORBIDDEN_ERROR = {
  code: 'APPLICATION_FORBIDDEN',
  detail: 'No tienes permisos para retirar esta postulación',
};

const applicationItemSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.application),
  jobOfferId: apiUuid(API_EXAMPLE_IDS.jobOffer),
  vacancyTitle: apiString('Desarrollador Backend Junior'),
  companyName: apiString('Tecnología Andina S.R.L.'),
  affinityPercentage: apiInteger(82, { minimum: 0, maximum: 100 }),
  status: apiEnum(
    Object.values(ApplicationStatus),
    ApplicationStatus.IN_REVIEW,
  ),
  appliedDate: apiDateTime('2026-11-10T14:32:00.000Z'),
});

const applicationContactSchema = apiObject({
  applicationId: apiUuid(API_EXAMPLE_IDS.application),
  jobOfferId: apiUuid(API_EXAMPLE_IDS.jobOffer),
  vacancyTitle: apiString('Desarrollador Backend Junior'),
  companyId: apiUuid(API_EXAMPLE_IDS.company),
  companyName: apiString('Tecnología Andina S.R.L.'),
  recruiters: apiArray(
    apiObject({
      id: apiUuid(API_EXAMPLE_IDS.recruiter),
      fullName: apiString('Lucía Mamani Quispe'),
    }),
  ),
});

export function apiFindMyApplications() {
  return applyDecorators(
    ApiOperation({
      operationId: 'listMyApplications',
      summary: 'Lista las postulaciones de la persona autenticada',
      description:
        'Devuelve todas las postulaciones de la persona con la vacante, la empresa, el porcentaje de afinidad actual, el estado y la fecha de postulación. Incluye las retiradas: el cliente decide si las muestra. No tiene paginación. Sin `sortBy` se ordena por fecha de postulación, de la más reciente a la más antigua; los empates se resuelven por fecha, título de la vacante e identificador. Roles: titulado, estudiante.',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ApplicationStatus,
      description: 'Devuelve solo las postulaciones en este estado',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: [...APPLICATION_SORT_FIELDS],
      description: 'Campo por el que se ordena el resultado',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: [...APPLICATION_SORT_ORDERS],
      description: 'Dirección del orden. Por defecto `desc`',
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Postulaciones de la persona, con su afinidad actual',
      data: apiArray(applicationItemSchema),
    }),
    apiErrorResponse({
      status: 400,
      description: 'Algún parámetro de consulta no es válido',
      validation: [
        {
          field: 'sortBy',
          message:
            'Invalid option: expected one of "vacancy"|"company"|"affinity"|"status"|"date"',
        },
      ],
    }),
    apiAuthResponses({ roles: APPLICANT_ROLES }),
  );
}

export function apiReactivateApplication() {
  return applyDecorators(
    ApiOperation({
      operationId: 'reactivateApplication',
      summary: 'Vuelve a postular tras haber retirado la postulación',
      description:
        'Reactiva una postulación en estado "Retirada" sobre la misma fila: pasa a "En revisión" y su fecha de postulación se reinicia. Solo funciona si la vacante sigue publicada y no ha vencido. Roles: titulado, estudiante.',
    }),
    ApiParam(APPLICATION_ID_PARAM),
    ApiNoContentResponse({
      description: 'Postulación reactivada; la respuesta no tiene cuerpo',
    }),
    apiErrorResponse({
      status: 404,
      description:
        'La postulación no existe. También responde así un identificador con formato inválido',
      errors: [APPLICATION_NOT_FOUND_ERROR],
    }),
    apiErrorResponse({
      status: 409,
      description:
        'La postulación no está retirada o la vacante ya no está disponible',
      errors: [
        {
          code: 'APPLICATION_NOT_REACTIVABLE',
          detail:
            'La postulación no puede reactivarse en su estado actual o la vacante ya no está disponible.',
        },
      ],
    }),
    apiAuthResponses({
      roles: APPLICANT_ROLES,
      forbidden: [APPLICATION_FORBIDDEN_ERROR],
    }),
  );
}

export function apiGetApplicationContact() {
  return applyDecorators(
    ApiOperation({
      operationId: 'getApplicationContact',
      summary:
        'Obtiene los reclutadores con quienes contactar por una postulación',
      description:
        'Devuelve la vacante, la empresa y los reclutadores activos de la empresa, para abrir el chat desde "Mis postulaciones". Solo está disponible mientras la postulación está "En revisión", "Entrevista" o "Aceptada". Una postulación de otra persona responde como inexistente. Roles: titulado, estudiante.',
    }),
    ApiParam(APPLICATION_ID_PARAM),
    apiSuccessResponse({
      status: 200,
      description: 'Datos de contacto de la postulación',
      data: applicationContactSchema,
    }),
    apiErrorResponse({
      status: 404,
      description:
        'La postulación no existe o no pertenece a la persona. También responde así un identificador con formato inválido',
      errors: [APPLICATION_NOT_FOUND_ERROR],
    }),
    apiAuthResponses({
      roles: APPLICANT_ROLES,
      forbidden: [
        {
          code: 'APPLICATION_CONTACT_RESTRICTED',
          detail:
            'Esta postulación ya no permite la comunicación directa con el reclutador',
        },
      ],
    }),
  );
}

export function apiWithdrawApplication() {
  return applyDecorators(
    ApiOperation({
      operationId: 'withdrawApplication',
      summary: 'Retira una postulación',
      description:
        'Cambia el estado de la postulación a "Retirada". Solo se puede retirar mientras está "En revisión" o "Entrevista"; la actualización es condicional, así que dos solicitudes simultáneas no la retiran dos veces. Roles: titulado, estudiante.',
    }),
    ApiParam(APPLICATION_ID_PARAM),
    ApiNoContentResponse({
      description: 'Postulación retirada; la respuesta no tiene cuerpo',
    }),
    apiErrorResponse({
      status: 400,
      description:
        'La postulación no está en un estado desde el que se pueda retirar',
      errors: [
        {
          code: 'APPLICATION_NOT_WITHDRAWABLE',
          detail:
            'No se puede retirar una postulación en estado Aceptada o No seleccionado',
        },
      ],
    }),
    apiErrorResponse({
      status: 404,
      description:
        'La postulación no existe. También responde así un identificador con formato inválido',
      errors: [APPLICATION_NOT_FOUND_ERROR],
    }),
    apiAuthResponses({
      roles: APPLICANT_ROLES,
      forbidden: [APPLICATION_FORBIDDEN_ERROR],
    }),
  );
}
