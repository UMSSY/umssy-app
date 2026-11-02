import { describe, expect, it } from 'vitest';
import { toRequestStatusResponse } from '../mappers/request-status.mapper.js';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';

type RequestStatusRow = Parameters<typeof toRequestStatusResponse>[0];

function buildRow(overrides: Partial<RequestStatusRow> = {}): RequestStatusRow {
  return {
    requestCode: 'SOL-2026-0001',
    firstName: 'Ana María',
    lastName: 'Pérez López',
    submittedAt: new Date('2026-10-05T15:00:00.000Z'),
    reviewedAt: new Date('2026-10-06T10:00:00.000Z'),
    rejectionReason: 'Documento ilegible',
    status: { title: ACCESS_REQUEST_STATUS.REJECTED },
    documentType: { title: 'national_title' },
    documentFile: { size: 2048, mimeType: 'application/pdf' },
    ...overrides,
  };
}

describe('toRequestStatusResponse', () => {
  it('incluye el nombre completo únicamente para una solicitud rechazada', () => {
    const result = toRequestStatusResponse(buildRow());

    expect(result).toEqual({
      requestCode: 'SOL-2026-0001',
      status: ACCESS_REQUEST_STATUS.REJECTED,
      fullName: 'Ana María Pérez López',
      submittedAt: '2026-10-05T15:00:00.000Z',
      reviewedAt: '2026-10-06T10:00:00.000Z',
      rejectionReason: 'Documento ilegible',
      document: {
        type: 'national_title',
        size: 2048,
        mimeType: 'application/pdf',
      },
    });
  });

  it('elimina espacios externos al construir el nombre completo', () => {
    const result = toRequestStatusResponse(
      buildRow({
        firstName: '  Ana María  ',
        lastName: '  Pérez López  ',
      }),
    );

    expect(result).toHaveProperty('fullName', 'Ana María Pérez López');
  });

  it.each([
    ACCESS_REQUEST_STATUS.DRAFT,
    ACCESS_REQUEST_STATUS.PENDING,
    ACCESS_REQUEST_STATUS.IN_REVIEW,
    ACCESS_REQUEST_STATUS.APPROVED,
  ])('omite completamente fullName cuando el estado es %s', (status) => {
    const result = toRequestStatusResponse(
      buildRow({
        status: { title: status },
        reviewedAt: null,
        rejectionReason: null,
      }),
    );

    expect(result).not.toHaveProperty('fullName');
    expect(result).not.toHaveProperty('firstName');
    expect(result).not.toHaveProperty('lastName');
    expect(JSON.stringify(result)).not.toContain('Ana María');
    expect(JSON.stringify(result)).not.toContain('Pérez López');
  });

  it('no expone campos personales adicionales ni contenido documental', () => {
    const result = toRequestStatusResponse(buildRow());

    for (const field of [
      'firstName',
      'lastName',
      'idCardNumber',
      'sisCode',
      'phone',
      'email',
      'birthDate',
      'content',
    ]) {
      expect(result).not.toHaveProperty(field);
    }

    expect(result.document).toEqual({
      type: 'national_title',
      size: 2048,
      mimeType: 'application/pdf',
    });
  });

  it('conserva las fechas y el motivo nulos cuando no están disponibles', () => {
    const result = toRequestStatusResponse(
      buildRow({
        submittedAt: null,
        reviewedAt: null,
        rejectionReason: null,
      }),
    );

    expect(result).toMatchObject({
      submittedAt: null,
      reviewedAt: null,
      rejectionReason: null,
    });
  });

  it('devuelve document nulo cuando no existe el archivo', () => {
    const result = toRequestStatusResponse(
      buildRow({ documentFile: null }),
    );

    expect(result.document).toBeNull();
  });

  it('devuelve document nulo cuando no existe el tipo documental', () => {
    const result = toRequestStatusResponse(
      buildRow({ documentType: null }),
    );

    expect(result.document).toBeNull();
  });
});
