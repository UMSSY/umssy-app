import type { ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CareersController } from '../controllers/careers.controller.js';
import { SurveysController } from '../controllers/surveys.controller.js';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import { CareersRepository } from '../repositories/careers.repository.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import { createSurveySchema } from '../requests/create-survey.schema.js';
import { CareersService } from '../services/careers.service.js';
import { SurveysService } from '../services/surveys.service.js';

function contextFor(roles: string[], handler: () => unknown, controller: object): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'user-1', roles } }) }),
  } as unknown as ExecutionContext;
}

describe('SurveysController', () => {
  let surveysController: SurveysController;
  let careersController: CareersController;
  let surveysService: SurveysService;
  let careersService: CareersService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SurveysController, CareersController],
      providers: [
        SurveysService,
        CareersService,
        SurveysRepository,
        CareersRepository,
        SurveyMapper,
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    surveysController = moduleRef.get(SurveysController);
    careersController = moduleRef.get(CareersController);
    surveysService = moduleRef.get(SurveysService);
    careersService = moduleRef.get(CareersService);
  });

  it.each([SurveysController, CareersController])(
    'exige sesión con rol administrativo en %o',
    (controller) => {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([JwtAuthGuard, RolesGuard]);
      expect(Reflect.getMetadata(ROLES_KEY, controller)).toEqual(['administrativo']);
    },
  );

  it('responde 403 a un titulado que intenta crear una encuesta', () => {
    const guard = new RolesGuard(new Reflector());
    const context = contextFor(['titulado'], () => undefined, SurveysController);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenRoleException);
    expect(new ForbiddenRoleException().statusCode).toBe(403);
  });

  it('permite el acceso a un administrativo', () => {
    const guard = new RolesGuard(new Reflector());
    const context = contextFor(['administrativo'], () => undefined, SurveysController);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('delega la creación al service con el usuario autenticado', async () => {
    const request = { title: 'Borrador', status: 'draft' as const, questions: [] };
    const created = { id: 'survey-1', title: 'Borrador', status: 'draft' as const, createdAt: '' };
    const spy = vi.spyOn(surveysService, 'create').mockResolvedValue(created);

    await expect(surveysController.create(request, 'admin-1')).resolves.toBe(created);
    expect(spy).toHaveBeenCalledWith('admin-1', request);
  });

  it('valida el cuerpo con el esquema de creación', () => {
    const pipe = new ZodValidationPipe(createSurveySchema);

    expect(() => pipe.transform({ title: 'abc', status: 'draft' })).toThrow(RequestValidationException);
  });

  it('delega el listado de encuestas al service', async () => {
    const spy = vi.spyOn(surveysService, 'listSurveys').mockResolvedValue([]);

    await expect(surveysController.list()).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
  });

  it('delega el listado de carreras al service', async () => {
    const careers = [{ id: 'career-1', title: 'Ingeniería de Sistemas' }];
    vi.spyOn(careersService, 'listCareers').mockResolvedValue(careers);

    await expect(careersController.list()).resolves.toBe(careers);
  });
});
