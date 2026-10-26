import type { ApiResponseOptions } from '@nestjs/swagger';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';

export const REQUEST_STATUS_OK_RESPONSE: ApiResponseOptions = {
  description:
    'Estado de la solicitud. fullName aparece únicamente cuando el estado es rejected.',
  schema: {
    type: 'object',
    required: ['statusCode', 'data', 'detail', 'ok'],
    properties: {
      statusCode: { type: 'integer', example: 200 },
      ok: { type: 'boolean', example: true },
      detail: { type: 'string', example: 'Operación exitosa' },
      data: {
        type: 'object',
        additionalProperties: false,
        required: [
          'requestCode',
          'status',
          'submittedAt',
          'reviewedAt',
          'rejectionReason',
          'document',
        ],
        properties: {
          requestCode: { type: 'string', example: 'SOL-2026-0001' },
          status: {
            type: 'string',
            enum: Object.values(ACCESS_REQUEST_STATUS),
          },
          fullName: {
            type: 'string',
            description:
              'Nombre completo. Se omite completamente en estados distintos de rejected.',
            example: 'Ana Pérez',
          },
          submittedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          reviewedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          rejectionReason: { type: 'string', nullable: true },
          document: {
            type: 'object',
            nullable: true,
            additionalProperties: false,
            required: ['type', 'size', 'mimeType'],
            properties: {
              type: { type: 'string' },
              size: { type: 'integer' },
              mimeType: { type: 'string' },
            },
          },
        },
        oneOf: [
          {
            required: ['fullName'],
            properties: {
              status: { enum: [ACCESS_REQUEST_STATUS.REJECTED] },
            },
          },
          {
            properties: {
              status: {
                enum: [
                  ACCESS_REQUEST_STATUS.DRAFT,
                  ACCESS_REQUEST_STATUS.PENDING,
                  ACCESS_REQUEST_STATUS.IN_REVIEW,
                  ACCESS_REQUEST_STATUS.APPROVED,
                ],
              },
            },
            not: { required: ['fullName'] },
          },
        ],
      },
    },
  },
  examples: {
    rejected: {
      summary: 'Solicitud rechazada: incluye el nombre',
      value: {
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: {
          requestCode: 'SOL-2026-0001',
          status: ACCESS_REQUEST_STATUS.REJECTED,
          fullName: 'Ana Pérez',
          submittedAt: '2026-10-05T15:00:00.000Z',
          reviewedAt: '2026-10-06T10:00:00.000Z',
          rejectionReason: 'Documento ilegible',
          document: {
            type: 'national_title',
            size: 2048,
            mimeType: 'application/pdf',
          },
        },
      },
    },
    pending: {
      summary: 'Solicitud pendiente: omite el nombre',
      value: {
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: {
          requestCode: 'SOL-2026-0002',
          status: ACCESS_REQUEST_STATUS.PENDING,
          submittedAt: '2026-10-05T15:00:00.000Z',
          reviewedAt: null,
          rejectionReason: null,
          document: null,
        },
      },
    },
  },
};
