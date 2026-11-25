import { describe, expect, it, vi } from 'vitest';
import { AccessRequestDetailsRepository } from '../repositories/access-request-details.repository.js';
import { AccessRequestDetailsService } from '../services/access-request-details.service.js';

function build() {
  const findUnique = vi.fn();
  const repository = new AccessRequestDetailsRepository({
    accessRequest: { findUnique },
  } as never);
  return { findUnique, service: new AccessRequestDetailsService(repository) };
}

describe('AccessRequestDetailsService', () => {
  it('expone los datos del solicitante desde el dominio de Solicitudes', async () => {
    const { findUnique, service } = build();
    const details = {
      graduationYear: 2024,
      documentType: { title: 'Diploma académico' },
    };
    findUnique.mockResolvedValue(details);

    await expect(service.getApplicantDetails('request-1')).resolves.toEqual(
      details,
    );
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-1' },
      }),
    );
  });

  it('permite solicitudes sin tipo de documento', async () => {
    const { findUnique, service } = build();
    findUnique.mockResolvedValue({ graduationYear: 2024, documentType: null });

    await expect(service.getApplicantDetails('request-1')).resolves.toEqual({
      graduationYear: 2024,
      documentType: null,
    });
  });

  it('devuelve null cuando no existe la solicitud', async () => {
    const { findUnique, service } = build();
    findUnique.mockResolvedValue(null);

    await expect(service.getApplicantDetails('missing')).resolves.toBeNull();
  });

  it('propaga los fallos de infraestructura', async () => {
    const { findUnique, service } = build();
    const failure = new Error('Database connection timeout');
    findUnique.mockRejectedValue(failure);

    await expect(service.getApplicantDetails('request-1')).rejects.toBe(
      failure,
    );
  });
});
