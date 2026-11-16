import type { ApiErrorExample } from '../types/api-error-example.type.js';

export const UNAUTHENTICATED_ERROR: ApiErrorExample = {
  code: 'UNAUTHENTICATED',
  detail: 'Se requiere una sesión válida.',
};

export const FORBIDDEN_ROLE_ERROR: ApiErrorExample = {
  code: 'FORBIDDEN_ROLE',
  detail: 'No tienes el rol necesario para este recurso',
};

export const USER_INACTIVE_ERROR: ApiErrorExample = {
  code: 'USER_INACTIVE',
  detail: 'La cuenta del usuario está inactiva.',
};

export const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';

export const VALIDATION_ERROR_SUMMARY =
  'Algún dato de la solicitud no es válido; `errors` indica el campo y el motivo';

export const SUCCESS_DETAIL = 'Operación exitosa';

export const SUCCESS_DETAIL_OK = 'OK';
