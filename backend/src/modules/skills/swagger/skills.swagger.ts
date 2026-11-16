import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
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
  apiEnum,
  apiObject,
  apiString,
  apiUuid,
  type ApiSchema,
} from '../../../common/utils/api-schema.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { createCustomSkillSchema } from '../requests/create-custom-skill.request.js';
import { updateUserSkillsSchema } from '../requests/update-user-skills.request.js';

const SKILL_ORIGINS = ['manual', 'experience', 'cv'];

const PROFILE_NOT_FOUND_ERROR = {
  code: 'PROFILE_NOT_FOUND',
  detail: 'User profile not found',
};

const SKILL_NOT_FOUND_ERROR = {
  code: 'SKILL_NOT_FOUND',
  detail: 'Skill not found',
};

const DUPLICATE_SKILL_ERROR = {
  code: 'DUPLICATE_SKILL',
  detail: 'The same skill cannot be added twice',
};

const skillSchema: ApiSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.skill),
  name: apiString('NestJS'),
  isCustom: apiBoolean(false),
});

const ownSkillSchema: ApiSchema = apiObject({
  id: apiUuid(API_EXAMPLE_IDS.skill),
  name: apiString('NestJS'),
  isCustom: apiBoolean(false),
  origins: apiArray(apiEnum(SKILL_ORIGINS, 'experience')),
});

const SKILL_IDS_EXAMPLE = {
  skillIds: [API_EXAMPLE_IDS.skill, API_EXAMPLE_IDS.secondSkill],
};

const SKILL_IDS_VALIDATION = [{ field: 'skillIds.0', message: 'Invalid UUID' }];

export function apiListSkillCatalog() {
  return applyDecorators(
    ApiOperation({
      operationId: 'listSkillCatalog',
      summary: 'Busca en el catálogo de habilidades',
      description:
        'Devuelve las habilidades del catálogo ordenadas por nombre, sin las personalizadas. `search` filtra por los nombres que lo contienen, sin distinguir mayúsculas. No tiene paginación. Acepta cualquier rol autenticado.',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Texto que debe contener el nombre (hasta 100 caracteres)',
      example: 'nest',
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Habilidades del catálogo que coinciden con la búsqueda',
      data: apiArray(skillSchema),
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 400,
      description: 'El texto de búsqueda supera los 100 caracteres',
      validation: [
        {
          field: 'search',
          message: 'Too big: expected string to have <=100 characters',
        },
      ],
    }),
    apiAuthResponses(),
  );
}

export function apiCreateCustomSkill() {
  return applyDecorators(
    ApiOperation({
      operationId: 'createCustomSkill',
      summary: 'Crea una habilidad personalizada',
      description:
        'Normaliza el nombre (hasta 50 caracteres, solo letras, dígitos y `+ # . - _ / & ( )`, al menos una letra y sin repetir un carácter más de 3 veces seguidas) y crea la habilidad. Si ya existe una con ese nombre, devuelve la existente en lugar de un error. Las personalizadas no aparecen en el catálogo ni se usan para detectar. Acepta cualquier rol autenticado.',
    }),
    ApiBody(toApiBody(createCustomSkillSchema, { name: 'Power BI' })),
    apiSuccessResponse({
      status: 201,
      description: 'Habilidad creada, o la existente con el mismo nombre',
      data: {
        ...skillSchema,
        example: {
          id: API_EXAMPLE_IDS.skill,
          name: 'Power BI',
          isCustom: true,
        },
      },
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 400,
      description: 'El nombre no cumple las reglas',
      validation: [
        {
          field: 'name',
          message: 'El nombre contiene caracteres no permitidos',
        },
      ],
    }),
    apiAuthResponses(),
  );
}

export function apiGetOwnSkills() {
  return applyDecorators(
    ApiOperation({
      operationId: 'getOwnSkills',
      summary: 'Lista las habilidades del perfil de la persona autenticada',
      description:
        'Devuelve las habilidades del perfil con su origen: `manual` si la agregó la persona, `experience` si la respalda una experiencia laboral y `cv` si la respalda el CV. Una habilidad puede tener varios orígenes. Acepta cualquier rol autenticado.',
    }),
    apiSuccessResponse({
      status: 200,
      description: 'Habilidades del perfil con su origen',
      data: apiArray(ownSkillSchema),
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 404,
      description: 'La persona aún no tiene perfil',
      errors: [PROFILE_NOT_FOUND_ERROR],
    }),
    apiAuthResponses(),
  );
}

export function apiReplaceOwnSkills() {
  return applyDecorators(
    ApiOperation({
      operationId: 'replaceOwnSkills',
      summary: 'Reemplaza la lista de habilidades manuales del perfil',
      description:
        'Define las habilidades manuales del perfil con la lista enviada (hasta 50). Las indicadas pasan a ser manuales, incluso si estaban detectadas; las manuales que no se indican se eliminan, salvo las respaldadas por una experiencia o el CV, que quedan como detectadas. Las detectadas que no se indican se mantienen. No acepta identificadores repetidos. Después se pide al proceso de detección que actualice el perfil. Acepta cualquier rol autenticado.',
    }),
    ApiBody(toApiBody(updateUserSkillsSchema, SKILL_IDS_EXAMPLE)),
    apiSuccessResponse({
      status: 200,
      description: 'Habilidades del perfil después del reemplazo',
      data: apiArray(ownSkillSchema),
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 400,
      description: 'Algún identificador no es un UUID o hay más de 50',
      validation: SKILL_IDS_VALIDATION,
    }),
    apiErrorResponse({
      status: 404,
      description: 'La persona no tiene perfil o alguna habilidad no existe',
      errors: [PROFILE_NOT_FOUND_ERROR, SKILL_NOT_FOUND_ERROR],
    }),
    apiErrorResponse({
      status: 409,
      description: 'Hay identificadores repetidos en la solicitud',
      errors: [DUPLICATE_SKILL_ERROR],
    }),
    apiAuthResponses(),
  );
}

export function apiAddOwnSkills() {
  return applyDecorators(
    ApiOperation({
      operationId: 'addOwnSkills',
      summary: 'Agrega habilidades manuales al perfil',
      description:
        'Agrega al perfil, como manuales, las habilidades indicadas que aún no tiene (hasta 50 por solicitud). Las que ya estaban en el perfil se ignoran y no cambian de origen. Devuelve todas las habilidades del perfil. No acepta identificadores repetidos. Después se pide al proceso de detección que actualice el perfil. Acepta cualquier rol autenticado.',
    }),
    ApiBody(toApiBody(updateUserSkillsSchema, SKILL_IDS_EXAMPLE)),
    apiSuccessResponse({
      status: 201,
      description: 'Habilidades del perfil después de agregar',
      data: apiArray(ownSkillSchema),
      detail: SUCCESS_DETAIL_OK,
    }),
    apiErrorResponse({
      status: 400,
      description: 'Algún identificador no es un UUID o hay más de 50',
      validation: SKILL_IDS_VALIDATION,
    }),
    apiErrorResponse({
      status: 404,
      description: 'La persona no tiene perfil o alguna habilidad no existe',
      errors: [PROFILE_NOT_FOUND_ERROR, SKILL_NOT_FOUND_ERROR],
    }),
    apiErrorResponse({
      status: 409,
      description: 'Hay identificadores repetidos en la solicitud',
      errors: [DUPLICATE_SKILL_ERROR],
    }),
    apiAuthResponses(),
  );
}
