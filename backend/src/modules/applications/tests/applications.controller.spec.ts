import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { findApplicationsQuerySchema } from '../requests/find-applications.request.js';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ApplicationsController } from '../controllers/applications.controller.js';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplicationStatus } from '../types/applications.types.js';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let serviceMock: {
    findMyApplications: ReturnType<typeof vi.fn>;
    withdrawApplication: ReturnType<typeof vi.fn>;
  };

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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  describe('findMyApplications', () => {
    it('debe llamar al servicio con el id de usuario y query (incluyendo sortOrder por defecto)', async () => {
      const query = findApplicationsQuerySchema.parse({
        status: ApplicationStatus.IN_REVIEW,
      });
      serviceMock.findMyApplications.mockResolvedValue([]);

      const result = await controller.findMyApplications('user-1', query);

      expect(serviceMock.findMyApplications).toHaveBeenCalledWith('user-1', {
        status: ApplicationStatus.IN_REVIEW,
        sortOrder: 'desc',
      });
      expect(result).toEqual([]);
    });
  });

  describe('withdrawApplication', () => {
    it('debe solicitar el retiro de la postulacion', async () => {
      serviceMock.withdrawApplication.mockResolvedValue(undefined);

      const result = await controller.withdrawApplication('app-1', 'user-1');

      expect(serviceMock.withdrawApplication).toHaveBeenCalledWith(
        'app-1',
        'user-1',
      );
      expect(result).toBeUndefined();
    });
  });
});
