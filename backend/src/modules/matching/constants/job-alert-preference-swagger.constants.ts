import type { ApiResponseOptions } from '@nestjs/swagger';
import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import { JOB_ALERT_MODES, JOB_ALERT_SKILLS_REQUIRED_MESSAGE } from './job-alert-preference.constants.js';

const SUCCESS_DETAIL = 'Operación exitosa';

export const JOB_ALERT_AUTH_DESCRIPTION =
  '**Autenticación:** Bearer JWT. **Roles:** `estudiante` o `titulado`.';

const PREFERENCE_SCHEMA = {
  type: 'object',
  required: ['mode', 'savedMode', 'canFilterByProfile'],
  properties: {
    mode: {
      type: 'string',
      enum: [...JOB_ALERT_MODES],
      description:
        'Modo que se aplica hoy a los avisos. Es `ALL` mientras la persona no tenga habilidades.',
    },
    savedMode: {
      type: 'string',
      enum: [...JOB_ALERT_MODES],
      description:
        'Modo que la persona eligió; se conserva aunque hoy no se pueda aplicar. `ALL` si nunca eligió.',
    },
    canFilterByProfile: {
      type: 'boolean',
      description:
        'Falso mientras la persona no tenga ninguna habilidad: solo `ALL` está disponible.',
    },
  },
};

const PREFERENCE_EXAMPLE = {
  mode: 'MATCHING',
  savedMode: 'MATCHING',
  canFilterByProfile: true,
};

const okResponse = (description: string): ApiResponseOptions => ({
  status: 200,
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['statusCode', 'ok', 'detail', 'data'],
        properties: {
          statusCode: { type: 'integer', enum: [200] },
          ok: { type: 'boolean', enum: [true] },
          detail: { type: 'string', example: SUCCESS_DETAIL },
          data: PREFERENCE_SCHEMA,
        },
      },
      example: {
        statusCode: 200,
        ok: true,
        detail: SUCCESS_DETAIL,
        data: PREFERENCE_EXAMPLE,
      },
    },
  },
});

export const JOB_ALERT_GET_DESCRIPTION = [
  'Devuelve de qué vacantes nuevas quiere recibir aviso la persona autenticada.',
  '',
  JOB_ALERT_AUTH_DESCRIPTION,
  '',
  'Si la persona nunca eligió, `mode` y `savedMode` son `ALL`. Si eligió `MATCHING` o `HIGH_AFFINITY` y se quedó sin habilidades, `mode` es `ALL` (así se le avisa hoy) y `savedMode` conserva su elección, que se vuelve a aplicar al añadir una habilidad.',
].join('\n');

export const JOB_ALERT_PUT_DESCRIPTION = [
  'Guarda de qué vacantes nuevas quiere recibir aviso la persona autenticada. Se aplica a las próximas vacantes que se publiquen.',
  '',
  JOB_ALERT_AUTH_DESCRIPTION,
  '',
  '`ALL` siempre se puede guardar. `MATCHING` (afinidad mayor a 0 %) y `HIGH_AFFINITY` (afinidad desde 70 %) requieren al menos una habilidad en el perfil.',
].join('\n');

export const JOB_ALERT_GET_OK_RESPONSE = okResponse('Preferencia de avisos de la persona.');

export const JOB_ALERT_PUT_OK_RESPONSE = okResponse('Preferencia guardada, con el mismo formato que la lectura.');

export const JOB_ALERT_VALIDATION_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: 'El cuerpo no es válido o `mode` no es uno de los modos permitidos (`VALIDATION_ERROR`).',
  content: {
    'application/json': {
      schema: API_ERROR_SCHEMA,
      example: {
        statusCode: 400,
        ok: false,
        code: 'VALIDATION_ERROR',
        detail: 'mode: La preferencia de avisos no es válida',
        data: [{ field: 'mode', message: 'La preferencia de avisos no es válida' }],
      },
    },
  },
};

export const JOB_ALERT_SKILLS_REQUIRED_RESPONSE: ApiResponseOptions = {
  status: 422,
  description:
    'Se pidió `MATCHING` o `HIGH_AFFINITY` y la persona no tiene ninguna habilidad registrada (`JOB_ALERT_SKILLS_REQUIRED`).',
  content: {
    'application/json': {
      schema: API_ERROR_SCHEMA,
      example: {
        statusCode: 422,
        ok: false,
        code: 'JOB_ALERT_SKILLS_REQUIRED',
        detail: JOB_ALERT_SKILLS_REQUIRED_MESSAGE,
        data: null,
      },
    },
  },
};
