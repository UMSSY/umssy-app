import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ApplicationsController } from '../controllers/applications.controller.js';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplicationStatus } from '../types/applications.types.js';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findMyApplications: vi.fn(),
      withdrawApplication: vi.fn(),
};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  describe('findMyApplications', () => {
    it('debe llamar al servicio con el id de usuario y query (incluyendo sortOrder por defecto)', async () => {
      const mockUser = { id: 'user-1' };
      const query = { status: ApplicationStatus.IN_REVIEW };
      serviceMock.findMyApplications.mockResolvedValue([]);

      const result = await controller.findMyApplications(mockUser, query as any);

      expect(serviceMock.findMyApplications).toHaveBeenCalledWith('user-1', {
        status: ApplicationStatus.IN_REVIEW,
        sortOrder: 'desc',
      });
      expect(result).toEqual([]);
    });
  });

  describe('withdrawApplication', () => {
    it('debe solicitar el retiro de la postulacion', async () => {
      const mockUser = { id: 'user-1' };
      const mockUpdatedApp = { id: 'app-1', status: ApplicationStatus.WITHDRAWN };
      serviceMock.withdrawApplication.mockResolvedValue(mockUpdatedApp);

      const result = await controller.withdrawApplication('app-1', mockUser);

      expect(serviceMock.withdrawApplication).toHaveBeenCalledWith('app-1', 'user-1');
      expect(result).toEqual(mockUpdatedApp);
    });
  });
});