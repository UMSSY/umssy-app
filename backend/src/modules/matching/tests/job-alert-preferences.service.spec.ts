import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JobAlertMode } from '../enums/job-alert-mode.enum.js';
import { JobAlertSkillsRequiredException } from '../exceptions/job-alert-skills-required.exception.js';
import type { JobAlertPreferencesRepository } from '../repositories/job-alert-preferences.repository.js';
import { JobAlertPreferencesService } from '../services/job-alert-preferences.service.js';

describe('JobAlertPreferencesService', () => {
  const repository = { findMode: vi.fn(), upsertMode: vi.fn() };
  const userSkills = { getUserSkills: vi.fn() };
  let service: JobAlertPreferencesService;

  const withSkills = () =>
    userSkills.getUserSkills.mockResolvedValue([{ name: 'TypeScript' }]);
  const withoutSkills = () => userSkills.getUserSkills.mockResolvedValue([]);

  beforeEach(() => {
    vi.resetAllMocks();
    service = new JobAlertPreferencesService(
      repository as unknown as JobAlertPreferencesRepository,
      userSkills as unknown as UserSkillService,
    );
  });

  describe('get', () => {
    it('usa "Todas las vacantes" cuando la persona nunca eligió (AC-15.7)', async () => {
      repository.findMode.mockResolvedValue(null);
      withSkills();

      await expect(service.get('user-1')).resolves.toEqual({
        mode: 'ALL',
        savedMode: 'ALL',
        canFilterByProfile: true,
      });
    });

    it('aplica la elección guardada cuando tiene habilidades', async () => {
      repository.findMode.mockResolvedValue('HIGH_AFFINITY');
      withSkills();

      await expect(service.get('user-1')).resolves.toEqual({
        mode: 'HIGH_AFFINITY',
        savedMode: 'HIGH_AFFINITY',
        canFilterByProfile: true,
      });
    });

    it('aplica "Todas" y conserva la elección si se quedó sin habilidades (AC-15.13)', async () => {
      repository.findMode.mockResolvedValue('MATCHING');
      withoutSkills();

      await expect(service.get('user-1')).resolves.toEqual({
        mode: 'ALL',
        savedMode: 'MATCHING',
        canFilterByProfile: false,
      });
    });

    it('trata a quien aún no tiene perfil como sin habilidades', async () => {
      repository.findMode.mockResolvedValue(null);
      userSkills.getUserSkills.mockRejectedValue(new ProfileNotFoundException());

      await expect(service.get('user-1')).resolves.toEqual({
        mode: 'ALL',
        savedMode: 'ALL',
        canFilterByProfile: false,
      });
    });

    it('trata un valor guardado desconocido como "Todas"', async () => {
      repository.findMode.mockResolvedValue('OTRO');
      withSkills();

      await expect(service.get('user-1')).resolves.toMatchObject({
        mode: 'ALL',
        savedMode: 'ALL',
      });
    });

    it('no oculta fallos que no sean de perfil inexistente', async () => {
      repository.findMode.mockResolvedValue(null);
      userSkills.getUserSkills.mockRejectedValue(new Error('db caída'));

      await expect(service.get('user-1')).rejects.toThrow('db caída');
    });
  });

  describe('update', () => {
    it.each([JobAlertMode.MATCHING, JobAlertMode.HIGH_AFFINITY])(
      'guarda %s cuando la persona tiene habilidades',
      async (mode) => {
        withSkills();
        repository.findMode.mockResolvedValue(mode);

        await expect(service.update('user-1', mode)).resolves.toEqual({
          mode,
          savedMode: mode,
          canFilterByProfile: true,
        });
        expect(repository.upsertMode).toHaveBeenCalledWith('user-1', mode);
      },
    );

    it.each([JobAlertMode.MATCHING, JobAlertMode.HIGH_AFFINITY])(
      'rechaza %s sin habilidades y no guarda nada (AC-15.6)',
      async (mode) => {
        withoutSkills();

        await expect(service.update('user-1', mode)).rejects.toBeInstanceOf(
          JobAlertSkillsRequiredException,
        );
        expect(repository.upsertMode).not.toHaveBeenCalled();
      },
    );

    it('permite volver a "Todas" aunque no tenga habilidades', async () => {
      withoutSkills();
      repository.findMode.mockResolvedValue('ALL');

      await expect(service.update('user-1', JobAlertMode.ALL)).resolves.toEqual({
        mode: 'ALL',
        savedMode: 'ALL',
        canFilterByProfile: false,
      });
      expect(repository.upsertMode).toHaveBeenCalledWith('user-1', 'ALL');
    });
  });
});
