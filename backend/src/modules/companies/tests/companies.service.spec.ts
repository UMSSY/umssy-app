import { describe, expect, it, vi } from 'vitest';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception.js';
import type { CompaniesRepository } from '../repositories/companies.repository.js';
import { CompaniesService } from '../services/companies.service.js';

function setup(record: unknown) {
  const repository = { findProfile: vi.fn().mockResolvedValue(record) };
  const service = new CompaniesService(
    repository as unknown as CompaniesRepository,
  );
  return { repository, service };
}

describe('CompaniesService.getProfile', () => {
  it('devuelve el perfil de la empresa', async () => {
    const { repository, service } = setup({
      id: 'company-1',
      title: 'Tech Andina',
      description: 'Software a medida',
      profile: null,
      logo: null,
    });

    await expect(service.getProfile('company-1')).resolves.toMatchObject({
      id: 'company-1',
      name: 'Tech Andina',
    });
    expect(repository.findProfile).toHaveBeenCalledWith('company-1');
  });

  it('lanza COMPANY_NOT_FOUND si la empresa no existe', async () => {
    const { service } = setup(null);

    await expect(service.getProfile('company-1')).rejects.toBeInstanceOf(
      CompanyNotFoundException,
    );
  });
});
