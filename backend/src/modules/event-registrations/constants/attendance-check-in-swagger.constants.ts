import type { ApiBodyOptions, ApiResponseOptions } from '@nestjs/swagger';
import { HTTP_ERRORS } from '../../../common/constants/http-errors.constants.js';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { AttendanceAccessDeniedException } from '../exceptions/attendance-access-denied.exception.js';
import { AttendanceOutsideWindowException } from '../exceptions/attendance-outside-window.exception.js';
import { AttendancePassCancelledException } from '../exceptions/attendance-pass-cancelled.exception.js';
import { AttendancePassInvalidException } from '../exceptions/attendance-pass-invalid.exception.js';
import type { AttendanceErrorExample } from '../types/attendance-error-example.types.js';

const API_ERROR_REF = '#/components/schemas/ApiErrorResponse';

// Zod trims leading and trailing whitespace before validating, so the documented
// patterns accept it too and do not constrain the raw length.
export const ATTENDANCE_REFERENCE_PATTERNS = {
  qr: '^\\s*[Vv]1:[A-Fa-f0-9]{64}\\s*$',
  token: '^\\s*[A-Fa-f0-9]{64}\\s*$',
  registrationId:
    '^\\s*[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}\\s*$',
} as const;

export const ATTENDANCE_CHECK_IN_BODY: ApiBodyOptions = {
  examples: {
    qr: { summary: 'QR del pase', value: { reference: `v1:${'a'.repeat(64)}` } },
    token: { summary: 'Token del pase', value: { reference: 'a'.repeat(64) } },
    manual: { summary: 'ID de inscripción', value: { reference: '7b8988fd-6818-4929-858b-4d83b72873cf' } },
  },
  schema: {
    type: 'object',
    required: ['reference'],
    additionalProperties: false,
    properties: {
      reference: {
        type: 'string',
        oneOf: [
          { pattern: ATTENDANCE_REFERENCE_PATTERNS.qr },
          { pattern: ATTENDANCE_REFERENCE_PATTERNS.token },
          { pattern: ATTENDANCE_REFERENCE_PATTERNS.registrationId },
        ],
        description:
          'QR v1, token hexadecimal de 64 caracteres o UUID de inscripción. Se ignoran los espacios al inicio y al final. No se aceptan códigos cortos.',
        example: '7b8988fd-6818-4929-858b-4d83b72873cf',
      },
    },
  },
};

function errorExample(status: number, { summary, error }: AttendanceErrorExample) {
  return {
    summary,
    value: { statusCode: status, ok: false, code: error.code, detail: error.message, data: null },
  };
}

function attendanceErrorResponse(
  status: number,
  description: string,
  examples: Record<string, AttendanceErrorExample>,
): ApiResponseOptions {
  const codes = [...new Set(Object.values(examples).map(({ error }) => error.code))];
  return {
    status,
    description,
    content: {
      'application/json': {
        schema: {
          allOf: [
            { $ref: API_ERROR_REF },
            { type: 'object', properties: { code: { type: 'string', enum: codes } } },
          ],
        },
        examples: Object.fromEntries(
          Object.entries(examples).map(([name, example]) => [name, errorExample(status, example)]),
        ),
      },
    },
  };
}

const httpError = (status: number) => ({
  code: HTTP_ERRORS[status].code,
  message: HTTP_ERRORS[status].detail,
});

export const ATTENDANCE_CHECK_IN_ERROR_RESPONSES: ApiResponseOptions[] = [
  attendanceErrorResponse(400, 'Referencia o identificador inválido (`VALIDATION_ERROR`)', {
    validation: { summary: 'Referencia o UUID inválido', error: httpError(400) },
  }),
  attendanceErrorResponse(401, 'Sesión requerida (`UNAUTHENTICATED`)', {
    unauthenticated: { summary: 'Sin sesión válida', error: httpError(401) },
  }),
  attendanceErrorResponse(
    403,
    'Rol no permitido (`FORBIDDEN_ROLE`) o taller no gestionado por el usuario (`ATTENDANCE_ACCESS_DENIED`)',
    {
      forbiddenRole: { summary: 'Rol no permitido', error: new ForbiddenRoleException() },
      accessDenied: { summary: 'Taller no autorizado', error: new AttendanceAccessDeniedException() },
    },
  ),
  attendanceErrorResponse(409, 'Fuera de la ventana horaria del taller (`ATTENDANCE_OUTSIDE_WINDOW`)', {
    outsideWindow: { summary: 'Fuera de horario', error: new AttendanceOutsideWindowException() },
  }),
  attendanceErrorResponse(
    422,
    'Pase inválido (`ATTENDANCE_PASS_INVALID`) o inscripción cancelada (`ATTENDANCE_PASS_CANCELLED`)',
    {
      passInvalid: { summary: 'Pase inválido', error: new AttendancePassInvalidException() },
      passCancelled: { summary: 'Inscripción cancelada', error: new AttendancePassCancelledException() },
    },
  ),
  attendanceErrorResponse(500, 'Error interno al registrar asistencia (`INTERNAL_ERROR`)', {
    internal: { summary: 'Error interno', error: httpError(500) },
  }),
];
