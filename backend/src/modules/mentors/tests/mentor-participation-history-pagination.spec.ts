
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MentorParticipationController } from '../controllers/mentor-participation.controller.js';
import type { MentorParticipationService } from '../services/mentor-participation.service.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';

const createTestContext = () => {
  const service = {
    findMyHistory: vi.fn().mockResolvedValue([]),
    findMyHistoryPaginated: vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    }),
  };

  const controller = new MentorParticipationController(
    service as unknown as MentorParticipationService,
  );

  const user = {
    id: 'user-hu14',
  } as AuthenticatedUser;

  return { controller, service, user };
};

describe('mentor participation history pagination HU14', () => {
  it('conserva la consulta original cuando no se envían parámetros', async () => {
    const { controller, service, user } = createTestContext();

    await controller.findMyHistory(user);

    expect(service.findMyHistory).toHaveBeenCalledWith(user.id);
    expect(service.findMyHistoryPaginated).not.toHaveBeenCalled();
  });

  it('consulta la página y el límite solicitados', async () => {
    const { controller, service, user } = createTestContext();

    await controller.findMyHistory(user, '2', '10');

    expect(service.findMyHistoryPaginated).toHaveBeenCalledWith(
      user.id,
      2,
      10,
    );
    expect(service.findMyHistory).not.toHaveBeenCalled();
  });

  it('utiliza la primera página cuando solo se indica el límite', async () => {
    const { controller, service, user } = createTestContext();

    await controller.findMyHistory(user, undefined, '5');

    expect(service.findMyHistoryPaginated).toHaveBeenCalledWith(
      user.id,
      1,
      5,
    );
  });

  it('utiliza diez registros cuando solo se indica la página', async () => {
    const { controller, service, user } = createTestContext();

    await controller.findMyHistory(user, '3');

    expect(service.findMyHistoryPaginated).toHaveBeenCalledWith(
      user.id,
      3,
      10,
    );
  });

  it.each([
    ['0', '10'],
    ['-1', '10'],
    ['abc', '10'],
    ['1.5', '10'],
    ['1000001', '10'],
    ['1', '0'],
    ['1', '-5'],
    ['1', '101'],
    ['1', 'texto'],
    ['1', '2.5'],
  ])(
    'rechaza parámetros inválidos: page=%s, limit=%s',
    (page, limit) => {
      const { controller, service, user } = createTestContext();

      expect(() => controller.findMyHistory(user, page, limit)).toThrow(
        BadRequestException,
      );

      expect(service.findMyHistoryPaginated).not.toHaveBeenCalled();
    },
  );
});
