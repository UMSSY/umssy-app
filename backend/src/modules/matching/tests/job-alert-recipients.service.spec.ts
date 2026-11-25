import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsersService } from '../../users/services/users.service.js';
import type { JobAlertPreferencesRepository } from '../repositories/job-alert-preferences.repository.js';
import { JobAlertRecipientsService } from '../services/job-alert-recipients.service.js';
import type { VacancyScoringService } from '../services/vacancy-scoring.service.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

const vacancy = { id: 'offer-1', title: 'Backend' } as unknown as JobMatchRecord;

describe('JobAlertRecipientsService', () => {
  const users = { findActiveContactsByRoles: vi.fn() };
  const repository = { findFilteredModes: vi.fn() };
  const scoring = { getCandidate: vi.fn(), evaluate: vi.fn() };
  let service: JobAlertRecipientsService;

  const contacts = (...ids: string[]) =>
    users.findActiveContactsByRoles.mockResolvedValue(ids.map((id) => ({ id })));
  const filtered = (entries: Array<[string, string]>) =>
    repository.findFilteredModes.mockResolvedValue(new Map(entries));
  const scores = (byUser: Record<string, number | 'sin-habilidades' | 'error'>) => {
    scoring.getCandidate.mockImplementation(async (userId: string) => {
      if (byUser[userId] === 'error') throw new Error('falló la lectura del perfil');
      return { skills: byUser[userId] === 'sin-habilidades' ? [] : ['TypeScript'], userId };
    });
    scoring.evaluate.mockImplementation(
      async (_vacancy: JobMatchRecord, candidate: { userId: string }) => ({
        score: byUser[candidate.userId],
      }),
    );
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    filtered([]);
    service = new JobAlertRecipientsService(
      users as unknown as UsersService,
      repository as unknown as JobAlertPreferencesRepository,
      scoring as unknown as VacancyScoringService,
    );
  });

  it('solo considera estudiantes y titulados activos (AC-15.1)', async () => {
    contacts();

    await service.resolve(vacancy);

    expect(users.findActiveContactsByRoles).toHaveBeenCalledWith({
      roles: ['estudiante', 'titulado'],
    });
  });

  it('avisa a todos los que nunca eligieron sin calcular afinidad (AC-15.7)', async () => {
    contacts('a', 'b', 'c');

    await expect(service.resolve(vacancy)).resolves.toEqual(['a', 'b', 'c']);
    expect(scoring.getCandidate).not.toHaveBeenCalled();
  });

  it('con "MATCHING" avisa solo si la afinidad es mayor a 0 %', async () => {
    contacts('coincide', 'no-coincide');
    filtered([
      ['coincide', 'MATCHING'],
      ['no-coincide', 'MATCHING'],
    ]);
    scores({ coincide: 1, 'no-coincide': 0 });

    await expect(service.resolve(vacancy)).resolves.toEqual(['coincide']);
  });

  it('con "HIGH_AFFINITY" avisa solo desde 70 %', async () => {
    contacts('alta', 'justo', 'media');
    filtered([
      ['alta', 'HIGH_AFFINITY'],
      ['justo', 'HIGH_AFFINITY'],
      ['media', 'HIGH_AFFINITY'],
    ]);
    scores({ alta: 95, justo: 70, media: 69 });

    await expect(service.resolve(vacancy)).resolves.toEqual(['alta', 'justo']);
  });

  it('mezcla a quienes reciben todo con quienes tienen filtro', async () => {
    contacts('todos', 'filtrado-si', 'filtrado-no');
    filtered([
      ['filtrado-si', 'HIGH_AFFINITY'],
      ['filtrado-no', 'HIGH_AFFINITY'],
    ]);
    scores({ 'filtrado-si': 80, 'filtrado-no': 10 });

    await expect(service.resolve(vacancy)).resolves.toEqual(['todos', 'filtrado-si']);
  });

  it('avisa como "Todas" a quien tiene filtro pero se quedó sin habilidades (AC-15.13)', async () => {
    contacts('sin-skills');
    filtered([['sin-skills', 'HIGH_AFFINITY']]);
    scores({ 'sin-skills': 'sin-habilidades' });

    await expect(service.resolve(vacancy)).resolves.toEqual(['sin-skills']);
    expect(scoring.evaluate).not.toHaveBeenCalled();
  });

  it('ignora preferencias de personas que ya no son destinatarias', async () => {
    contacts('activo');
    filtered([['inactivo', 'MATCHING']]);

    await expect(service.resolve(vacancy)).resolves.toEqual(['activo']);
    expect(scoring.getCandidate).not.toHaveBeenCalled();
  });

  it('si falla el cálculo de una persona la omite y sigue con las demás', async () => {
    contacts('falla', 'bien');
    filtered([
      ['falla', 'MATCHING'],
      ['bien', 'MATCHING'],
    ]);
    scores({ falla: 'error', bien: 50 });

    await expect(service.resolve(vacancy)).resolves.toEqual(['bien']);
    expect(Logger.prototype.warn).toHaveBeenCalledTimes(1);
  });

  it('evalúa a todas las personas con filtro aunque superen el tamaño del lote', async () => {
    const ids = Array.from({ length: 60 }, (_, index) => `user-${index}`);
    contacts(...ids);
    filtered(ids.map((id): [string, string] => [id, 'MATCHING']));
    scores(Object.fromEntries(ids.map((id) => [id, 40])));

    const recipients = await service.resolve(vacancy);

    expect(recipients).toHaveLength(60);
    expect(scoring.evaluate).toHaveBeenCalledTimes(60);
    expect(scoring.evaluate).toHaveBeenCalledWith(vacancy, expect.anything());
  });
});
