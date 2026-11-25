
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { CompanyOwnershipGuard } from '../../../common/guards/company-ownership.guard.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobOffersController } from '../controllers/job-offers.controller.js';
import type { JobOffersService } from '../services/job-offers.service.js';

function setup() {
  const service = {
    close: vi.fn().mockResolvedValue({
      id: 'offer-1',
      status: 'Cerrada',
    }),
  };

  const controller = new JobOffersController(
    service as unknown as JobOffersService,
  );

  return { controller, service };
}

function getCloseHandler() {
  const handler = Object.getOwnPropertyDescriptor(
    JobOffersController.prototype,
    'close',
  )?.value;

  if (!handler) {
    throw new Error('No se encontró el endpoint de cierre');
  }

  return handler;
}

describe('JobOffersController.close', () => {
  it('delega el cierre manual al servicio', async () => {
    const { controller, service } = setup();

    await expect(
      controller.close('company-1', 'offer-1'),
    ).resolves.toEqual({
      id: 'offer-1',
      status: 'Cerrada',
    });

    expect(service.close).toHaveBeenCalledOnce();
    expect(service.close).toHaveBeenCalledWith(
      'company-1',
      'offer-1',
    );
  });

  it('expone el cierre mediante PATCH', () => {
    const handler = getCloseHandler();

    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.PATCH,
    );

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'companies/:companyId/job-offers/:jobOfferId/close',
    );
  });

  it('exige autenticación, rol empresa y pertenencia', () => {
    const handler = getCloseHandler();

    expect(Reflect.getMetadata('__guards__', handler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
      CompanyOwnershipGuard,
    ]);

    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      'empresa',
    ]);
  });

  it.each(['companyId', 'jobOfferId'] as const)(
    'rechaza un identificador inválido en %s',
    async (field) => {
      const params = Reflect.getMetadata(
        '__routeArguments__',
        JobOffersController,
        'close',
      ) as Record<
        string,
        {
          data?: string;
          pipes: {
            transform: (
              value: string,
              metadata: object,
            ) => Promise<string>;
          }[];
        }
      >;

      const parameter = Object.values(params).find(
        (param) => param.data === field,
      );

      const pipe = parameter?.pipes?.[0];

      if (!pipe) {
        throw new Error(`No se encontró el validador de ${field}`);
      }

      await expect(
        pipe.transform('no-es-uuid', {
          type: 'param',
          data: field,
        }),
      ).rejects.toBeInstanceOf(RequestValidationException);
    },
  );
});
