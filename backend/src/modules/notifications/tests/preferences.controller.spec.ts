import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { PreferencesController } from '../controllers/preferences.controller.js';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';

describe('PreferencesController', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  const mockSubscriptionsService = {
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [PreferencesController],
      providers: [
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (!req.headers.authorization) {
            throw new UnauthorizedException();
          }
          req.user = { id: 'user-from-token' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    mockSubscriptionsService.getPreferences.mockReset();
    mockSubscriptionsService.updatePreferences.mockReset();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /notifications/preferences', () => {
    it('devuelve la preferencia del usuario autenticado', async () => {
      const preferences = {
        pushEnabled: false,
        emailEnabled: true,
        inAppEnabled: true,
      };
      mockSubscriptionsService.getPreferences.mockResolvedValue(preferences);

      const response = await request(app.getHttpServer())
        .get('/notifications/preferences')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toEqual(preferences);
      expect(mockSubscriptionsService.getPreferences).toHaveBeenCalledWith(
        'user-from-token',
      );
    });

    it('rechaza la solicitud sin sesión', async () => {
      const response = await request(app.getHttpServer()).get(
        '/notifications/preferences',
      );

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(mockSubscriptionsService.getPreferences).not.toHaveBeenCalled();
    });
  });

  describe('PUT /notifications/preferences', () => {
    it('guarda la preferencia del usuario autenticado', async () => {
      mockSubscriptionsService.updatePreferences.mockResolvedValue({ ok: true });
      const body = { pushEnabled: false, emailEnabled: true, inAppEnabled: true };

      const response = await request(app.getHttpServer())
        .put('/notifications/preferences')
        .set('Authorization', 'Bearer token')
        .send(body);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toEqual({ ok: true });
      expect(mockSubscriptionsService.updatePreferences).toHaveBeenCalledWith(
        'user-from-token',
        body,
      );
    });

    it.each([
      ['Push', { pushEnabled: true, emailEnabled: false, inAppEnabled: true }],
      ['solo la app', { pushEnabled: false, emailEnabled: false, inAppEnabled: true }],
    ])('acepta la combinación «%s»', async (_name, body) => {
      mockSubscriptionsService.updatePreferences.mockResolvedValue({ ok: true });

      const response = await request(app.getHttpServer())
        .put('/notifications/preferences')
        .set('Authorization', 'Bearer token')
        .send(body);

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockSubscriptionsService.updatePreferences).toHaveBeenCalledWith(
        'user-from-token',
        body,
      );
    });

    it('rechaza activar Push y correo al mismo tiempo', async () => {
      const response = await request(app.getHttpServer())
        .put('/notifications/preferences')
        .set('Authorization', 'Bearer token')
        .send({ pushEnabled: true, emailEnabled: true, inAppEnabled: true });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'emailEnabled' }),
        ]),
      );
      expect(mockSubscriptionsService.updatePreferences).not.toHaveBeenCalled();
    });

    it.each([
      ['sin campos', {}],
      ['con un campo que no es booleano', { pushEnabled: 'si', emailEnabled: false, inAppEnabled: true }],
      ['con un campo faltante', { pushEnabled: false, emailEnabled: true }],
    ])('responde 400 con un cuerpo %s', async (_name, body) => {
      const response = await request(app.getHttpServer())
        .put('/notifications/preferences')
        .set('Authorization', 'Bearer token')
        .send(body);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(mockSubscriptionsService.updatePreferences).not.toHaveBeenCalled();
    });

    it('rechaza la solicitud sin sesión', async () => {
      const response = await request(app.getHttpServer())
        .put('/notifications/preferences')
        .send({ pushEnabled: false, emailEnabled: true, inAppEnabled: true });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(mockSubscriptionsService.updatePreferences).not.toHaveBeenCalled();
    });
  });
});