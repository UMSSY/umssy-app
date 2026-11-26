import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { CompanyOwnershipGuard } from '../../../common/guards/company-ownership.guard.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { CompaniesController } from '../controllers/companies.controller.js';
import type { CompaniesService } from '../services/companies.service.js';

describe('CompaniesController', () => {
  it('delega la lectura del perfil en el servicio', async () => {
    const service = {
      getProfile: vi.fn().mockResolvedValue({ id: 'company-1' }),
    };
    const controller = new CompaniesController(
      service as unknown as CompaniesService,
    );

    await expect(controller.getProfile('company-1')).resolves.toEqual({
      id: 'company-1',
    });
    expect(service.getProfile).toHaveBeenCalledWith('company-1');
  });

  it('exige sesión, rol empresa y que la empresa sea la de la sesión', () => {
    const handler = Object.getOwnPropertyDescriptor(
      CompaniesController.prototype,
      'getProfile',
    )?.value;
    if (!handler) throw new Error('No se encontró el handler del perfil');

    expect(Reflect.getMetadata('__guards__', handler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
      CompanyOwnershipGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['empresa']);
  });

  it('delega las empresas destacadas en el servicio sin pedir sesión', async () => {
    const service = { listFeatured: vi.fn().mockResolvedValue([]) };
    const controller = new CompaniesController(
      service as unknown as CompaniesService,
    );
    const handler = Object.getOwnPropertyDescriptor(
      CompaniesController.prototype,
      'listFeatured',
    )?.value;
    if (!handler) throw new Error('No se encontró el handler de destacadas');

    await expect(controller.listFeatured()).resolves.toEqual([]);
    expect(service.listFeatured).toHaveBeenCalled();
    expect(Reflect.getMetadata('__guards__', handler)).toBeUndefined();
  });
});
