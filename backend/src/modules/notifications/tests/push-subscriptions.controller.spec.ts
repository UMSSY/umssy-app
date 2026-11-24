import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PushSubscriptionsController } from '../controllers/push-subscriptions.controller.js';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';

describe('PushSubscriptionsController', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  const validBody = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    userAgent: 'Mozilla/5.0 (Android 13)',
  };

  const mockSubscriptionsService = {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn((key: string) => {
      if (key === 'VAPID_PUBLIC_KEY') return 'public-key-value';
      return undefined;
    }),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [PushSubscriptionsController],
      providers: [
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-from-token' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    
    await app.init();

    mockSubscriptionsService.subscribe.mockReset();
    mockSubscriptionsService.unsubscribe.mockReset();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /push/public-key', () => {
    it('returns only the VAPID public key', async () => {
      const res = await request(app.getHttpServer()).get('/push/public-key');

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.data.publicKey).toBe('public-key-value');
      expect(JSON.stringify(res.body)).not.toContain('priv');
    });
  });

  describe('POST /push/subscriptions', () => {
    it('returns 200 and delegates to service with userId from JWT', async () => {
      mockSubscriptionsService.subscribe.mockResolvedValue({ ok: true });

      const res = await request(app.getHttpServer())
        .post('/push/subscriptions')
        .send(validBody);

      expect(res.status).toBe(HttpStatus.OK);
      expect(mockSubscriptionsService.subscribe).toHaveBeenCalledWith(
        'user-from-token',
        validBody,
      );
    });

    it('returns 400 with field-level errors on invalid body', async () => {
      const res = await request(app.getHttpServer())
        .post('/push/subscriptions')
        .send({ endpoint: 'not-a-url', keys: {} });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      
      expect(res.body.detail).toBeDefined();
      expect(res.body.detail).toContain('endpoint');
      expect(res.body.detail).toContain('keys.p256dh');
      expect(res.body.detail).toContain('keys.auth');
      
      expect(mockSubscriptionsService.subscribe).not.toHaveBeenCalled();
    });

    it('ignores userId from body (uses JWT only)', async () => {
      mockSubscriptionsService.subscribe.mockResolvedValue({ ok: true });

      await request(app.getHttpServer())
        .post('/push/subscriptions')
        .send({ ...validBody, userId: 'attacker-id' });

      expect(mockSubscriptionsService.subscribe).toHaveBeenCalledWith(
        'user-from-token',
        expect.not.objectContaining({ userId: 'attacker-id' }),
      );
    });
  });

  describe('DELETE /push/subscriptions', () => {
    it('returns 204 and delegates with userId from JWT', async () => {
      mockSubscriptionsService.unsubscribe.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .delete('/push/subscriptions')
        .send({ endpoint: validBody.endpoint });

      expect(res.status).toBe(HttpStatus.NO_CONTENT);
      expect(mockSubscriptionsService.unsubscribe).toHaveBeenCalledWith(
        'user-from-token',
        validBody.endpoint,
      );
    });

    it('returns 204 even if subscription did not exist', async () => {
      mockSubscriptionsService.unsubscribe.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .delete('/push/subscriptions')
        .send({ endpoint: 'https://example.com/unknown' });

      expect(res.status).toBe(HttpStatus.NO_CONTENT);
    });
  });
});