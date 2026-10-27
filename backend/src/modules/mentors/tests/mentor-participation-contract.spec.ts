import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { MentorParticipationController } from '../controllers/mentor-participation.controller.js';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';
import { createMentorParticipationSchema } from '../requests/create-mentor-participation.schema.js';

const preferences = {
  technicalAreaIds: ['11111111-1111-4111-8111-111111111111'],
  orientationTypeIds: ['22222222-2222-4222-8222-222222222222'],
};

describe('contrato de solicitudes HU7-2', () => {
  it('todas las operaciones usan el usuario JWT y el controlador exige autenticación', async () => {
    const service = {
      create: vi.fn(),
      findMyRequest: vi.fn(),
      findMyHistory: vi.fn(),
      updatePreferences: vi.fn(),
      cancel: vi.fn(),
    };
    const controller = new MentorParticipationController(
      service as unknown as MentorParticipationService,
    );
    const user = { id: 'jwt-user' } as AuthenticatedUser;
    expect(
      Reflect.getMetadata(GUARDS_METADATA, MentorParticipationController),
    ).toContain(JwtAuthGuard);
    await controller.create(user, preferences);
    await controller.findMyRequest(user);
    await controller.findMyHistory(user);
    await controller.updatePreferences(user, preferences);
    await controller.cancel(user);
    expect(service.create).toHaveBeenCalledWith(user.id, preferences);
    expect(service.findMyRequest).toHaveBeenCalledWith(user.id);
    expect(service.findMyHistory).toHaveBeenCalledWith(user.id);
    expect(service.updatePreferences).toHaveBeenCalledWith(
      user.id,
      preferences,
    );
    expect(service.cancel).toHaveBeenCalledWith(user.id);
  });

  it('rechaza userId en el cuerpo, UUID inválidos y preferencias vacías o duplicadas', () => {
    expect(createMentorParticipationSchema.safeParse(preferences).success).toBe(
      true,
    );
    for (const invalid of [
      { ...preferences, userId: 'other-user' },
      { ...preferences, technicalAreaIds: [] },
      { ...preferences, orientationTypeIds: ['invalid'] },
      {
        ...preferences,
        technicalAreaIds: [
          ...preferences.technicalAreaIds,
          ...preferences.technicalAreaIds,
        ],
      },
    ]) {
      expect(createMentorParticipationSchema.safeParse(invalid).success).toBe(
        false,
      );
    }
  });

  it.each([
    ['NOT_ELIGIBLE', 403],
    ['INVALID_PREFERENCES', 400],
    ['CAPACITY_AVAILABLE', 409],
    ['OFFER_EXISTS', 409],
  ])('traduce %s a error controlado %s', async (result, statusCode) => {
    const repository = { createRequest: vi.fn().mockResolvedValue({ result }) };
    const service = new MentorParticipationService(
      repository as unknown as MentorParticipationRepository,
    );
    await expect(service.create('user', preferences)).rejects.toMatchObject({
      statusCode,
    });
  });

  it('preserva la solicitud original en un intento duplicado', async () => {
    const request = {
      id: 'original',
      queuedAt: new Date('2026-01-01'),
      status: 'PENDING',
    };
    const service = new MentorParticipationService({
      createRequest: vi.fn().mockResolvedValue({
        result: 'ALREADY_EXISTS',
        request,
      }),
    } as unknown as MentorParticipationRepository);
    await expect(service.create('user', preferences)).rejects.toMatchObject({ statusCode: 409, data: { code: 'REQUEST_ALREADY_EXISTS' } });
  });

  it('propaga errores de almacenamiento sin convertirlos en respuestas exitosas', async () => {
    const failure = new Error('DB unavailable');
    const repository = {
      createRequest: vi.fn().mockRejectedValue(failure),
      updatePreferences: vi.fn().mockRejectedValue(failure),
      cancelRequest: vi.fn().mockRejectedValue(failure),
    };
    const service = new MentorParticipationService(
      repository as unknown as MentorParticipationRepository,
    );
    await expect(service.create('user', preferences)).rejects.toBe(failure);
    await expect(service.updatePreferences('user', preferences)).rejects.toBe(
      failure,
    );
    await expect(service.cancel('user')).rejects.toBe(failure);
  });
});
