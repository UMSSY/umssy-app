export const HTTP_ERRORS: Record<number, { code: string; detail: string }> = {
  400: { code: 'VALIDATION_ERROR', detail: 'Los parámetros de la solicitud no son válidos.' },
  401: { code: 'UNAUTHENTICATED', detail: 'Se requiere una sesión válida.' },
  403: { code: 'FORBIDDEN', detail: 'No tienes permiso para realizar esta operación.' },
  404: { code: 'NOT_FOUND', detail: 'El recurso solicitado no existe.' },
  409: { code: 'CONFLICT', detail: 'La solicitud entra en conflicto con el estado actual.' },
  413: { code: 'PAYLOAD_TOO_LARGE', detail: 'El contenido de la solicitud es demasiado grande.' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', detail: 'El formato de la solicitud no está permitido.' },
  422: { code: 'UNPROCESSABLE_ENTITY', detail: 'No se pudo procesar la solicitud.' },
  500: { code: 'INTERNAL_ERROR', detail: 'Ocurrió un error interno al procesar la solicitud.' },
};
