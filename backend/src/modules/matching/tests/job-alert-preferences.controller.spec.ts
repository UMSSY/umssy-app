import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobAlertMode } from '../enums/job-alert-mode.enum.js';
import { JobAlertPreferencesController } from '../controllers/job-alert-preferences.controller.js';
import type { JobAlertPreferencesService } from '../services/job-alert-preferences.service.js';

describe('JobAlertPreferencesController', () => {
  const preference = {
    mode: JobAlertMode.MATCHING,
    savedMode: JobAlertMode.MATCHING,
    canFilterByProfile: true,
  };

  const build = () => {
    const service = {
      get: vi.fn().mockResolvedValue(preference),
      update: vi.fn().mockResolvedValue(preference),
    };
    const controller = new JobAlertPreferencesController(
      service as unknown as JobAlertPreferencesService,
    );
    return { service, controller };
  };

  it('protege el endpoint con autenticación y roles', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, JobAlertPreferencesController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('solo permite los roles titulado y estudiante', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, JobAlertPreferencesController),
    ).toEqual(['titulado', 'estudiante']);
  });

  it('lee la preferencia de la persona autenticada', async () => {
    const { service, controller } = build();

    await expect(controller.get('user-1')).resolves.toEqual(preference);
    expect(service.get).toHaveBeenCalledWith('user-1');
  });

  it('guarda el modo elegido para la persona autenticada', async () => {
    const { service, controller } = build();

    await expect(
      controller.update('user-1', { mode: JobAlertMode.MATCHING }),
    ).resolves.toEqual(preference);
    expect(service.update).toHaveBeenCalledWith('user-1', JobAlertMode.MATCHING);
  });
});
