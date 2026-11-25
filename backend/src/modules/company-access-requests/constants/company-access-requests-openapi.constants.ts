const UUID_PARAM_BASE = {
  required: true,
  schema: { type: 'string', format: 'uuid' },
  example: '550e8400-e29b-41d4-a716-446655440000',
};

export const COMPANY_REQUEST_ID_PARAM = {
  ...UUID_PARAM_BASE,
  name: 'id',
  description: 'Identificador UUID de la solicitud de acceso empresarial.',
};

export const COMPANY_ID_PARAM = {
  ...UUID_PARAM_BASE,
  name: 'companyId',
  description: 'Identificador UUID de la empresa aprobada.',
};

export const COMPANY_REQUEST_CODE_PARAM = {
  name: 'code',
  required: true,
  description: 'Código de seguimiento asignado a la solicitud.',
  schema: { type: 'string' },
  example: 'EMP-2026-0001',
};

const COMPANY_BASE_FIELDS = {
  companyName: { type: 'string', minLength: 2, maxLength: 100, example: 'Tech Andina S.R.L.' },
  sector: { type: 'string', minLength: 2, maxLength: 100, example: 'Desarrollo de Software' },
  cityId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
  description: {
    type: 'string',
    minLength: 10,
    maxLength: 1000,
    example: 'Empresa dedicada a soluciones tecnológicas empresariales en Bolivia.',
  },
  email: { type: 'string', format: 'email', maxLength: 150, example: 'contacto@techandina.bo' },
  phone: { type: 'string', example: '71234567' },
  websiteUrl: { type: 'string', maxLength: 255, example: 'https://techandina.bo' },
  username: { type: 'string', minLength: 3, maxLength: 100, example: 'tech.andina' },
};

export const CREATE_COMPANY_REQUEST_BODY = {
  description: 'Datos iniciales para crear el borrador de solicitud empresarial.',
  schema: {
    type: 'object',
    required: ['companyName', 'sector', 'cityId', 'description', 'email', 'phone', 'username'],
    properties: COMPANY_BASE_FIELDS,
  },
};

export const UPDATE_COMPANY_REQUEST_BODY = {
  description: 'Campos modificables de una solicitud empresarial en revisión.',
  schema: { type: 'object', properties: COMPANY_BASE_FIELDS },
};

export const REQUEST_CORRECTION_BODY = {
  description: 'Categoría y detalle de la subsanación solicitada.',
  schema: {
    type: 'object',
    required: ['reasonCategory', 'customDetails'],
    properties: {
      reasonCategory: { type: 'string', minLength: 3, maxLength: 150, example: 'DOCUMENTACION' },
      customDetails: {
        type: 'string',
        minLength: 10,
        maxLength: 1000,
        example: 'La carta membretada debe incluir sello institucional legible.',
      },
    },
  },
};

export const REJECT_COMPANY_REQUEST_BODY = {
  description: 'Motivo de rechazo de la solicitud empresarial.',
  schema: {
    type: 'object',
    properties: {
      reason: { type: 'string', minLength: 5, maxLength: 1000 },
      reasonCategory: { type: 'string', example: 'REQUISITOS' },
      customDetails: { type: 'string', example: 'NIT no verificable en padrón vigente.' },
    },
  },
};

export const ACTIVATE_COMPANY_ACCOUNT_BODY = {
  description: 'Credenciales y OTP para activar la cuenta empresarial aprobada.',
  schema: {
    type: 'object',
    required: ['requestCode', 'email', 'code', 'password'],
    properties: {
      requestCode: { type: 'string', example: 'EMP-2026-0001' },
      email: { type: 'string', format: 'email', example: 'contacto@techandina.bo' },
      code: { type: 'string', minLength: 6, maxLength: 6, example: '123456' },
      password: { type: 'string', minLength: 8, maxLength: 72, example: 'ClaveSegura2026!' },
    },
  },
};

export const REPORT_INCONSISTENCY_BODY = {
  description: 'Reporte de inconsistencia enviado por la empresa postulante.',
  schema: {
    type: 'object',
    required: ['requestCode', 'email', 'observation'],
    properties: {
      requestCode: { type: 'string', example: 'EMP-2026-0001' },
      email: { type: 'string', format: 'email', example: 'contacto@techandina.bo' },
      observation: {
        type: 'string',
        minLength: 5,
        maxLength: 500,
        example: 'La razón social aparece con un carácter tipográfico incorrecto.',
      },
    },
  },
};

const buildMultipartBody = (description: string) => ({
  description,
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: { type: 'string', format: 'binary' },
    },
  },
});

export const UPLOAD_LOGO_MULTIPART_BODY = buildMultipartBody(
  'Archivo de imagen del logo (PNG, JPG, WEBP o SVG). Tamaño máximo permitido: 2 MB.',
);

export const UPLOAD_DOCUMENT_MULTIPART_BODY = buildMultipartBody(
  'Carta de solicitud en hoja membretada (PDF o imagen admitida por el interceptor). Tamaño máximo permitido: 10 MB.',
);

export const CITIES_OK_RESPONSE = {
  description: 'Listado alfabético de ciudades disponibles para el registro.',
  schema: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Cochabamba' },
      },
    },
  },
};

const COMPANY_DETAIL_PROPERTIES = {
  id: { type: 'string', format: 'uuid' },
  requestCode: { type: 'string', nullable: true, example: 'EMP-2026-0001' },
  companyName: { type: 'string', example: 'Tech Andina S.R.L.' },
  sector: { type: 'string', example: 'Desarrollo de Software' },
  description: { type: 'string' },
  email: { type: 'string', format: 'email' },
  phone: { type: 'string' },
  websiteUrl: { type: 'string', nullable: true },
  username: { type: 'string' },
  submittedAt: { type: 'string', format: 'date-time', nullable: true },
  reviewedAt: { type: 'string', format: 'date-time', nullable: true },
  rejectionReason: { type: 'string', nullable: true },
  ocrMatchScore: { type: 'number', nullable: true },
  ocrFieldResults: { type: 'object', nullable: true },
  status: {
    type: 'object',
    properties: { id: { type: 'string' }, title: { type: 'string', example: 'IN_REVIEW' } },
  },
  city: {
    type: 'object',
    nullable: true,
    properties: { id: { type: 'string', format: 'uuid' }, title: { type: 'string' } },
  },
};

export const COMPANY_SUMMARY_OK_RESPONSE = {
  description: 'Contadores agregados de solicitudes empresariales por estado.',
  schema: {
    type: 'object',
    properties: {
      pendingCount: { type: 'integer', example: 5 },
      inReviewCount: { type: 'integer', example: 2 },
      approvedCount: { type: 'integer', example: 14 },
      rejectedCount: { type: 'integer', example: 1 },
    },
  },
};

export const COMPANY_LIST_OK_RESPONSE = {
  description: 'Página de solicitudes empresariales filtradas.',
  schema: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: { type: 'object', properties: COMPANY_DETAIL_PROPERTIES },
      },
      total: { type: 'integer', example: 12 },
    },
  },
};

export const COMPANY_DETAIL_OK_RESPONSE = {
  description: 'Detalle completo de la solicitud de acceso empresarial y evaluación OCR.',
  schema: { type: 'object', properties: COMPANY_DETAIL_PROPERTIES },
};

export const BINARY_FILE_OK_RESPONSE = {
  description: 'Contenido binario del archivo solicitado.',
  schema: { type: 'string', format: 'binary' },
};
