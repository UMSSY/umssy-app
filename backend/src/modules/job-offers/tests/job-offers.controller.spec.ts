import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobOffersController } from '../controllers/job-offers.controller.js';
import { JobOfferModality } from '../types/job-offer.enum.js';
import type { CreateJobOfferRequest } from '../requests/create-job-offer.request.js';
import type { JobOffersService } from '../services/job-offers.service.js';

function createController() {
  const service = {
    create: vi.fn().mockResolvedValue({ id: 'offer-1', createdAt: '2026-10-12T00:00:00.000Z' }),
    listPublished: vi.fn().mockResolvedValue([]),
    listByCompany: vi.fn().mockResolvedValue([]),
    getByCompanyAndId: vi.fn().mockResolvedValue({ id: 'offer-1' }),
    update: vi.fn().mockResolvedValue({ id: 'offer-1' }),
    reopen: vi.fn().mockResolvedValue({ id: 'offer-1', status: 'Publicada' }),
    listSkillCatalog: vi.fn().mockResolvedValue([{ id: 'skill-1', name: 'Docker' }]),
  };
  return { controller: new JobOffersController(service as unknown as JobOffersService), service };
}

describe('JobOffersController', () => {
  it('delega la creación en el servicio', async () => {
    const { controller, service } = createController();
    const request = { title: 'DevOps' } as CreateJobOfferRequest;

    await expect(controller.create('company-1', request)).resolves.toEqual({
      id: 'offer-1',
      createdAt: '2026-10-12T00:00:00.000Z',
    });
    expect(service.create).toHaveBeenCalledWith('company-1', request);
  });

  it('exige sesión y rol empresa para publicar una vacante', () => {
    const handler = Object.getOwnPropertyDescriptor(JobOffersController.prototype, 'create')?.value;
    if (!handler) throw new Error('No se encontró el handler de publicación');

    expect(Reflect.getMetadata('__guards__', handler)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['empresa']);
  });

  it('delega los listados y el catálogo en el servicio', async () => {
    const { controller, service } = createController();

    await controller.listPublished();
    await controller.listByCompany('company-1', {
      modality: JobOfferModality.REMOTE,
      sortBy: 'createdAt',
      order: 'desc',
    });
    await expect(controller.listSkillCatalog()).resolves.toEqual([{ id: 'skill-1', name: 'Docker' }]);

    expect(service.listPublished).toHaveBeenCalledOnce();
    expect(service.listByCompany).toHaveBeenCalledWith('company-1', {
      modality: JobOfferModality.REMOTE,
      sortBy: 'createdAt',
      order: 'desc',
    });
  });

  it('exige sesión y rol empresa para consultar el historial de vacantes', () => {
    const handler = Object.getOwnPropertyDescriptor(
      JobOffersController.prototype,
      'listByCompany',
    )?.value;

    if (!handler) throw new Error('No se encontró el handler del historial');

    expect(Reflect.getMetadata('__guards__', handler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);

    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['empresa']);
  });

  it('rechaza un id de empresa que no es UUID con el formato estándar de validación', async () => {
    const paramTypes = Reflect.getMetadata(
      '__routeArguments__',
      JobOffersController,
      'listByCompany',
    ) as Record<
      string,
      { data?: string; pipes: { transform: (value: string, metadata: object) => Promise<string> }[] }
    >;
    const companyIdParam = Object.values(paramTypes).find((param) => param.data === 'companyId');
    const [pipe] = companyIdParam?.pipes ?? [];
    await expect(pipe.transform('no-es-uuid', { type: 'param', data: 'companyId' })).rejects.toBeInstanceOf(
      RequestValidationException,
    );
  });

  it('delega la consulta individual de una vacante de la empresa', async () => {
    const { controller, service } = createController();

    await expect(controller.getByCompanyAndId('company-1', 'offer-1')).resolves.toEqual({
      id: 'offer-1',
    });
    expect(service.getByCompanyAndId).toHaveBeenCalledWith('company-1', 'offer-1');
  });

  it('rechaza un id de vacante que no es UUID con el formato estándar de validación', async () => {
    const paramTypes = Reflect.getMetadata(
      '__routeArguments__',
      JobOffersController,
      'getByCompanyAndId',
    ) as Record<
      string,
      { data?: string; pipes: { transform: (value: string, metadata: object) => Promise<string> }[] }
    >;
    const jobOfferIdParam = Object.values(paramTypes).find((param) => param.data === 'jobOfferId');
    const [pipe] = jobOfferIdParam?.pipes ?? [];

    await expect(pipe.transform('no-es-uuid', { type: 'param', data: 'jobOfferId' })).rejects.toBeInstanceOf(
      RequestValidationException,
    );
  });

  it('protege los detalles para sesiones con rol de empresa', () => {
    const handler = Object.getOwnPropertyDescriptor(
      JobOffersController.prototype,
      'getByCompanyAndId',
    )?.value;
    if (!handler) throw new Error('No se encontró el handler de detalles de vacante');

    expect(Reflect.getMetadata('__guards__', handler)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['empresa']);
  });

  it('delega la edición de una vacante de la empresa', async () => {
    const { controller, service } = createController();
    const request = { title: 'DevOps' } as CreateJobOfferRequest;

    await expect(controller.update('company-1', 'offer-1', request)).resolves.toEqual({
      id: 'offer-1',
    });
    expect(service.update).toHaveBeenCalledWith('company-1', 'offer-1', request);
  });

  it('exige sesión y rol empresa para editar una vacante', () => {
    const handler = Object.getOwnPropertyDescriptor(
      JobOffersController.prototype,
      'update',
    )?.value;

    if (!handler) throw new Error('No se encontró el handler de edición');

    expect(Reflect.getMetadata('__guards__', handler)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['empresa']);
  });
  it('delega la reapertura de una vacante de la empresa', async () => {
    const { controller, service } = createController();

    await expect(controller.reopen('company-1', 'offer-1')).resolves.toEqual({
      id: 'offer-1',
      status: 'Publicada',
    });
    expect(service.reopen).toHaveBeenCalledWith('company-1', 'offer-1');
  });

  it('exige sesión y rol empresa para reabrir una vacante', () => {
    const handler = Object.getOwnPropertyDescriptor(JobOffersController.prototype, 'reopen')?.value;
    if (!handler) throw new Error('No se encontró el handler de reapertura');

    expect(Reflect.getMetadata('__guards__', handler)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['empresa']);
  });

  it('rechaza un id de vacante que no es UUID al reabrir', async () => {
    const paramTypes = Reflect.getMetadata('__routeArguments__', JobOffersController, 'reopen') as Record<
      string,
      { data?: string; pipes: { transform: (value: string, metadata: object) => Promise<string> }[] }
    >;
    const jobOfferIdParam = Object.values(paramTypes).find((param) => param.data === 'jobOfferId');
    const [pipe] = jobOfferIdParam?.pipes ?? [];

    await expect(pipe.transform('no-es-uuid', { type: 'param', data: 'jobOfferId' })).rejects.toBeInstanceOf(
      RequestValidationException,
    );
  });
});
