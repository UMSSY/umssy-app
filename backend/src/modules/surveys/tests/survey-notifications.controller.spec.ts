import type { ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { SurveyNotificationsController } from '../controllers/survey-notifications.controller.js';
import type { SurveyNotificationResponse } from '../responses/survey-notification.response.js';
import { SurveysService } from '../services/surveys.service.js';

function contextFor(roles: string[], handler: () => unknown, controller: object): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'user-1', roles } }) }),
  } as unknown as ExecutionContext;
}

describe('SurveyNotificationsController', () => {
  let controller: SurveyNotificationsController;
  let surveysService: SurveysService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SurveyNotificationsController],
      providers: [
        {
          provide: SurveysService,
          useValue: {
            getNotificationsForUser: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(SurveyNotificationsController);
    surveysService = moduleRef.get(SurveysService);
  });

  it('exige sesión con rol titulado o administrativo', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, SurveyNotificationsController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, SurveyNotificationsController)).toEqual([
      'titulado',
      'administrativo',
    ]);
  });

  it('permite el acceso a un titulado', () => {
    const guard = new RolesGuard(new Reflector());
    const context = contextFor(['titulado'], () => undefined, SurveyNotificationsController);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite el acceso a un administrativo', () => {
    const guard = new RolesGuard(new Reflector());
    const context = contextFor(['administrativo'], () => undefined, SurveyNotificationsController);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rechaza el acceso a un estudiante o empresa', () => {
    const guard = new RolesGuard(new Reflector());
    const context = contextFor(['estudiante'], () => undefined, SurveyNotificationsController);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenRoleException);
  });

  it('obtiene las notificaciones de encuestas asignadas al usuario', async () => {
    const mockNotifications: SurveyNotificationResponse[] = [
      {
        id: 's1',
        title: 'Encuesta de Empleabilidad',
        publishedAt: '2026-10-15T00:00:00.000Z',
        status: 'pending',
      },
      {
        id: 's2',
        title: 'Encuesta de Satisfacción',
        publishedAt: '2026-09-20T00:00:00.000Z',
        status: 'answered',
      },
      {
        id: 's3',
        title: 'Encuesta Anterior',
        publishedAt: '2026-08-01T00:00:00.000Z',
        status: 'expired',
      },
    ];

    const spy = vi.spyOn(surveysService, 'getNotificationsForUser').mockResolvedValue(mockNotifications);

    const result = await controller.getNotifications('user-1');

    expect(spy).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockNotifications);
  });
});
