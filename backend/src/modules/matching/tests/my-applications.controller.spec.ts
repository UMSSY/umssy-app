import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { MyApplicationsController } from '../controllers/my-applications.controller.js';
import type { MyApplicationsService } from '../services/my-applications.service.js';

const USER_ID = 'b2a1c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const APPLICATION_ID = '7c3e9a10-1d2b-4f5a-9c8e-2b4d6f8a0c11';

function createController() {
  const service = {
    listMine: vi.fn().mockResolvedValue([]),
    withdraw: vi.fn().mockResolvedValue(undefined),
  };
  return {
    service,
    controller: new MyApplicationsController(service as unknown as MyApplicationsService),
  };
}

describe('HU-05 - MyApplicationsController', () => {
  it('protege el controlador con JwtAuthGuard y RolesGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, MyApplicationsController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });

  it('sólo permite el acceso a titulados y estudiantes', () => {
    expect(Reflect.getMetadata(ROLES_KEY, MyApplicationsController)).toEqual([
      'titulado',
      'estudiante',
    ]);
  });

  it('lista las postulaciones del usuario autenticado', async () => {
    const { controller, service } = createController();

    await expect(controller.listMine(USER_ID)).resolves.toEqual([]);
    expect(service.listMine).toHaveBeenCalledWith(USER_ID);
  });

  it('retira la postulación indicada del usuario autenticado', async () => {
    const { controller, service } = createController();

    await expect(controller.withdraw(APPLICATION_ID, USER_ID)).resolves.toBeUndefined();
    expect(service.withdraw).toHaveBeenCalledWith(USER_ID, APPLICATION_ID);
  });
});
