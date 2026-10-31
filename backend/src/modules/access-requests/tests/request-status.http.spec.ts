import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { AuthService } from '../../auth/services/auth.service.js';
import { FilesService } from '../../files/services/files.service.js';
import { AccessRequestsController } from '../controllers/access-requests.controller.js';
import { AccessRequestsRepository } from '../repositories/access-requests.repository.js';
import { AccessRequestsService } from '../services/access-requests.service.js';
import { ActivationOtpService } from '../services/activation-otp.service.js';
import { RejectionNotificationService } from '../services/rejection-notification.service.js';
import { AuditEventRecorderService } from '../../audit-events/services/audit-event-recorder.service.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';
import { DocumentReadingService } from '../services/document-reading.service.js';

const REQUEST_CODE = 'SOL-2026-0001';
const EMAIL = 'ana@example.com';
const STATUS_PATH = `/api/access-requests/status/${REQUEST_CODE}`;

const FOUND_REQUEST = {
  requestCode: REQUEST_CODE,
  firstName: 'Ana María',
  lastName: 'Pérez López',
  submittedAt: new Date('2026-10-05T15:00:00.000Z'),
  reviewedAt: new Date('2026-10-06T10:00:00.000Z'),
  rejectionReason: 'Documento ilegible',
  status: { title: 'rejected' },
  documentType: { title: 'national_title' },
  documentFile: { size: 2048, mimeType: 'application/pdf' },
};

describe('Consulta HTTP del estado de una solicitud', () => {
  const repository = { findByRequestCode: vi.fn() };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AccessRequestsController],
      providers: [
        AccessRequestsService,
        { provide: AccessRequestsRepository, useValue: repository },
        { provide: AuthService, useValue: {} },
        { provide: FilesService, useValue: {} },
        { provide: ActivationOtpService, useValue: {} },
        { provide: RejectionNotificationService, useValue: {} },
        { provide: AuditEventRecorderService, useValue: {} },
        { provide: DocumentValidationRepository, useValue: {} },
        { provide: DocumentReadingService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.resetAllMocks();

    repository.findByRequestCode.mockImplementation(
      async (code: string, email: string) =>
        code === REQUEST_CODE && email === EMAIL ? FOUND_REQUEST : null,
    );
  });

  it('devuelve fullName para rejected dentro del contrato HTTP existente', async () => {
    const response = await request(app.getHttpServer())
      .get(STATUS_PATH)
      .query({ email: EMAIL })
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'Operación exitosa',
      data: {
        requestCode: REQUEST_CODE,
        status: 'rejected',
        fullName: 'Ana María Pérez López',
        submittedAt: '2026-10-05T15:00:00.000Z',
        reviewedAt: '2026-10-06T10:00:00.000Z',
        rejectionReason: 'Documento ilegible',
        document: {
          type: 'national_title',
          size: 2048,
          mimeType: 'application/pdf',
        },
      },
    });
  });

  it.each(['draft', 'pending', 'in_review', 'approved'])(
    'no filtra el nombre en la respuesta HTTP cuando el estado es %s',
    async (status) => {
      repository.findByRequestCode.mockResolvedValue({
        ...FOUND_REQUEST,
        status: { title: status },
        reviewedAt: null,
        rejectionReason: null,
      });

      const response = await request(app.getHttpServer())
        .get(STATUS_PATH)
        .query({ email: EMAIL })
        .expect(200);

      expect(response.body.data.status).toBe(status);
      expect(response.body.data).not.toHaveProperty('fullName');
      expect(response.body.data).not.toHaveProperty('firstName');
      expect(response.body.data).not.toHaveProperty('lastName');
      expect(response.text).not.toContain('Ana María');
      expect(response.text).not.toContain('Pérez López');
    },
  );

  it('normaliza el correo antes de consultar el repository', async () => {
    await request(app.getHttpServer())
      .get(STATUS_PATH)
      .query({ email: '  ANA@EXAMPLE.COM  ' })
      .expect(200);

    expect(repository.findByRequestCode).toHaveBeenCalledWith(
      REQUEST_CODE,
      EMAIL,
    );
  });

  it('mantiene el mismo 404 sin filtraciones para código o correo incorrectos', async () => {
    await request(app.getHttpServer())
      .get(STATUS_PATH)
      .query({ email: EMAIL })
      .expect(200);

    const missingCode = await request(app.getHttpServer())
      .get('/api/access-requests/status/SOL-2026-9999')
      .query({ email: EMAIL })
      .expect(404);

    const wrongEmail = await request(app.getHttpServer())
      .get(STATUS_PATH)
      .query({ email: 'otra@example.com' })
      .expect(404);

    expect(missingCode.body).toEqual({
      statusCode: 404,
      code: 'ACCESS_REQUEST_NOT_FOUND',
      data: null,
      detail: 'La solicitud de acceso no existe',
      ok: false,
    });
    expect(wrongEmail.body).toEqual(missingCode.body);

    for (const response of [missingCode, wrongEmail]) {
      expect(response.text).not.toContain('Ana María');
      expect(response.text).not.toContain('Pérez López');
      expect(response.text).not.toContain(REQUEST_CODE);
      expect(response.text).not.toContain(EMAIL);
      expect(response.text).not.toContain('Documento ilegible');
    }
  });

  it.each([
    {
      label: 'código inválido',
      path: '/api/access-requests/status/abc',
      query: { email: EMAIL },
      expectedError: {
        field: 'code',
        message: 'El código de solicitud no es válido',
      },
    },
    {
      label: 'correo ausente',
      path: STATUS_PATH,
      query: {},
      expectedError: {
        field: 'email',
        message: 'El correo es obligatorio',
      },
    },
    {
      label: 'correo inválido',
      path: STATUS_PATH,
      query: { email: 'no-es-correo' },
      expectedError: {
        field: 'email',
        message: 'El correo no tiene un formato válido',
      },
    },
  ])(
    'rechaza $label sin consultar el repository',
    async ({ path, query, expectedError }) => {
      const response = await request(app.getHttpServer())
        .get(path)
        .query(query)
        .expect(400);

      expect(repository.findByRequestCode).not.toHaveBeenCalled();
      expect(response.body.statusCode).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.data).toEqual([expectedError]);
      expect(response.body.errors).toEqual([expectedError]);
      expect(response.text).not.toContain('Ana María');
      expect(response.text).not.toContain('Pérez López');
    },
  );

  it('Swagger documenta fullName exclusivamente para rejected y conserva los errores', () => {
    const config = new DocumentBuilder()
      .setTitle('Pruebas de consulta de solicitudes')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const operation = document.paths['/api/access-requests/status/{code}']?.get;

    expect(operation).toBeDefined();

    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'code',
          in: 'path',
          required: true,
        }),
        expect.objectContaining({
          name: 'email',
          in: 'query',
          required: true,
        }),
      ]),
    );

    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('404');

    expect(operation?.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            required: ['statusCode', 'data', 'detail', 'ok'],
            properties: {
              data: {
                additionalProperties: false,
                properties: {
                  fullName: { type: 'string' },
                },
                oneOf: [
                  {
                    required: ['fullName'],
                    properties: {
                      status: { enum: ['rejected'] },
                    },
                  },
                  {
                    properties: {
                      status: {
                        enum: ['draft', 'pending', 'in_review', 'approved'],
                      },
                    },
                    not: { required: ['fullName'] },
                  },
                ],
              },
            },
          },
          examples: {
            rejected: {
              value: {
                data: {
                  status: 'rejected',
                  fullName: 'Ana Pérez',
                },
              },
            },
            pending: {
              value: {
                data: {
                  status: 'pending',
                },
              },
            },
          },
        },
      },
    });
  });
});
