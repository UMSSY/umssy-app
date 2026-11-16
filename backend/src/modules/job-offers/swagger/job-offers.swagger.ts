import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { API_EXAMPLE_IDS } from '../../../common/constants/api-example-ids.constants.js';
import { SUCCESS_DETAIL_OK } from '../../../common/constants/api-errors.constants.js';
import { apiSuccessResponse } from '../../../common/decorators/api-success-response.decorator.js';
import {
  apiArray,
  apiDateTime,
  apiEnum,
  apiInteger,
  apiNullable,
  apiObject,
  apiString,
  apiUuid,
  type ApiSchema,
} from '../../../common/utils/api-schema.js';
import {
  JobOfferContractType,
  JobOfferModality,
  JobOfferStatus,
} from '../types/job-offer.enum.js';

const jobOfferSkillSchema: ApiSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.skill),
  name: apiString('NestJS'),
});

const publishedJobOfferSchema: ApiSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.jobOffer),
  title: apiString('Desarrollador Backend Junior', { maxLength: 60 }),
  description: apiString('Desarrollo y mantenimiento de APIs REST.', {
    maxLength: 3000,
  }),
  category: apiString('Tecnología'),
  modality: apiEnum(Object.values(JobOfferModality), JobOfferModality.HYBRID),
  contractType: apiEnum(
    Object.values(JobOfferContractType),
    JobOfferContractType.FULL_TIME,
  ),
  status: apiEnum(Object.values(JobOfferStatus), JobOfferStatus.PUBLISHED),
  positionsAvailable: apiInteger(2, { minimum: 1, maximum: 500 }),
  salaryRange: apiString('Bs 5.000 - 7.000'),
  languages: apiString('Español, Inglés'),
  locationUrl: apiString('https://maps.app.goo.gl/AbCdEf123456', {
    format: 'uri',
  }),
  expiresAt: apiNullable(apiDateTime('2026-12-02T13:00:00.000Z')),
  publishedAt: apiDateTime('2026-11-02T13:00:00.000Z'),
  createdAt: apiDateTime('2026-11-02T13:00:00.000Z'),
  company: apiObject({
    id: apiUuid(API_EXAMPLE_IDS.company),
    name: apiString('Tecnología Andina S.R.L.'),
  }),
  skills: apiArray(jobOfferSkillSchema),
});

export function apiListPublishedJobOffers() {
  return applyDecorators(
    ApiOperation({
      operationId: 'listPublishedJobOffers',
      summary: 'Lista las vacantes publicadas y vigentes para los egresados',
      description:
        'Devuelve las vacantes en estado "Publicada" que no tienen fecha de expiración o aún no vencieron, de la más reciente a la más antigua. No tiene paginación ni filtros: la búsqueda se hace en el cliente. Es público: no requiere sesión.',
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Vacantes publicadas, de la más reciente a la más antigua',
      data: apiArray(publishedJobOfferSchema),
    }),
  );
}

export function apiListJobOfferSkillCatalog() {
  return applyDecorators(
    ApiOperation({
      operationId: 'listJobOfferSkillCatalog',
      summary: 'Lista el catálogo cerrado de tecnologías para una vacante',
      description:
        'Devuelve las habilidades del catálogo que una empresa puede elegir como requisito de una vacante, sin las personalizadas. No tiene paginación. Es público: no requiere sesión.',
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Tecnologías verificadas del catálogo',
      data: apiArray(jobOfferSkillSchema),
      detail: SUCCESS_DETAIL_OK,
    }),
  );
}
