import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { FilesRepository } from '../../files/repositories/files.repository.js';
import { FilesService } from '../../files/services/files.service.js';
import { CompanyDocumentCorrectionController } from '../controllers/company-document-correction.controller.js';
import { COMPANY_PUBLIC_REQUEST_LIMITS } from '../constants/company-document-correction.constants.js';
import { CompanyDocumentCorrectionConflictException } from '../exceptions/company-document-correction-conflict.exception.js';
import { CompanyDocumentCorrectionGuard } from '../guards/company-document-correction.guard.js';
import { CompanyRequestThrottlerGuard } from '../guards/company-request-throttler.guard.js';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';
import { CompanyAccessRequestsService } from '../services/company-access-requests.service.js';
import { CompanyDocumentCorrectionAuthorizationService } from '../services/company-document-correction-authorization.service.js';
import { CompanyDocumentCorrectionService } from '../services/company-document-correction.service.js';
import type { CompanyDocumentCorrectionSnapshot } from '../types/company-document-correction.types.js';
import { CORRECTION_SECRET } from './company-document-correction.fixture.js';

const PDF = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n');
const CODE = 'EMP-2026-0001';

class InMemoryCompanyRequests {
  snapshot: CompanyDocumentCorrectionSnapshot = {
    id: 'request-1',
    requestCode: CODE,
    documentFileId: 'file-1',
    reviewedAt: new Date('2026-11-20T15:00:00.000Z'),
    status: { title: 'OBSERVED' },
  };
  duplicates: Record<string, unknown> = {};
  findCorrectionSnapshotByCode = vi.fn(async () => ({ ...this.snapshot }));
  findById = vi.fn(async () => ({
    id: 'request-1',
    companyName: 'Tech Andina',
    email: 'contacto@techandina.com',
    username: 'techandina',
  }));
  findDuplicates = vi.fn(async () => ({
    existingCompany: null,
    existingUser: null,
    activeRequest: null,
    existingUsername: null,
    ...this.duplicates,
  }));
  replaceDocumentAndReopen = vi.fn(
    async (operation: {
      context: { revision: Date; previousFileId: string | null; requestCode: string };
      createFile: (tx: unknown) => Promise<{ id: string }>;
    }) => {
      const same =
        this.snapshot.documentFileId === operation.context.previousFileId &&
        this.snapshot.reviewedAt?.getTime() === operation.context.revision.getTime() &&
        ['OBSERVED', 'REJECTED'].includes(this.snapshot.status.title);
      if (!same) throw new CompanyDocumentCorrectionConflictException();
      const file = await operation.createFile({});
      this.snapshot = {
        ...this.snapshot,
        documentFileId: file.id,
        reviewedAt: null,
        status: { title: 'PENDING' },
      };
      return { requestCode: operation.context.requestCode, status: 'PENDING' as const };
    },
  );
}

describe('POST /company-access-requests/:code/resubmit (integración HTTP)', () => {
  let app: INestApplication;
  let store: InMemoryCompanyRequests;
  let token: string;
  const filesRepository = { create: vi.fn(), delete: vi.fn() };
  const requestsService = { evaluateLetterheadOcr: vi.fn() };

  beforeAll(async () => {
    store = new InMemoryCompanyRequests();
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: CORRECTION_SECRET })],
        }),
        ThrottlerModule.forRoot([
          {
            ttl: COMPANY_PUBLIC_REQUEST_LIMITS.windowMs,
            limit: COMPANY_PUBLIC_REQUEST_LIMITS.resubmit,
          },
        ]),
      ],
      controllers: [CompanyDocumentCorrectionController],
      providers: [
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: CompanyAccessRequestsRepository, useValue: store },
        { provide: CompanyAccessRequestsService, useValue: requestsService },
        { provide: FilesRepository, useValue: filesRepository },
        FilesService,
        CompanyDocumentCorrectionAuthorizationService,
        CompanyDocumentCorrectionService,
        CompanyDocumentCorrectionGuard,
        CompanyRequestThrottlerGuard,
      ],
    }).compile();
    app = module.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    await app.init();
    token = module
      .get(CompanyDocumentCorrectionAuthorizationService)
      .issueFor(store.snapshot);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    filesRepository.create.mockImplementation(async (data: { name: string; size: number }) => ({
      id: 'file-2',
      ...data,
    }));
    filesRepository.delete.mockResolvedValue(undefined);
    requestsService.evaluateLetterheadOcr.mockResolvedValue(null);
  });

  const send = (code: string, bearer: string | null, file: Buffer = PDF, ip = '203.0.113.1') => {
    const call = request(app.getHttpServer())
      .post(`/company-access-requests/${code}/resubmit`)
      .set('X-Forwarded-For', ip)
      .attach('file', file, { filename: 'carta.pdf', contentType: 'application/pdf' });
    return bearer ? call.set('Authorization', `Bearer ${bearer}`) : call;
  };

  it('sin permiso responde 401 sin revelar datos de la solicitud', async () => {
    const response = await send(CODE, null, PDF, '203.0.113.10');
    expect(response.status).toBe(401);
    expect(JSON.stringify(response.body)).not.toContain('Tech Andina');
  });

  it('con un permiso de otro formato o alterado responde 401', async () => {
    expect((await send(CODE, `dcr1.${'A'.repeat(43)}`, PDF, '203.0.113.11')).status).toBe(401);
    expect((await send(CODE, token.replace(/.$/, 'x'), PDF, '203.0.113.12')).status).toBe(401);
    expect((await send('SOL-2026-0001', token, PDF, '203.0.113.13')).status).toBe(401);
  });

  it('un archivo de formato no permitido responde 400 y no cambia la solicitud', async () => {
    const response = await send(CODE, token, Buffer.from('texto plano sin firma'), '203.0.113.14');
    expect(response.status).toBe(400);
    expect(store.snapshot.status.title).toBe('OBSERVED');
  });

  it('un archivo de más de 10 MB responde 413 en español', async () => {
    const response = await send(CODE, token, Buffer.alloc(10 * 1024 * 1024 + 1, 1), '203.0.113.15');
    expect(response.status).toBe(413);
    expect(store.snapshot.status.title).toBe('OBSERVED');
  });

  it('con un conflicto de unicidad responde 409 con data.field y no cambia la solicitud', async () => {
    store.duplicates = { existingCompany: { id: 'company-1' } };
    const response = await send(CODE, token, PDF, '203.0.113.16');
    expect(response.status).toBe(409);
    expect(response.body.code ?? response.body.data?.code).toBeDefined();
    expect(JSON.stringify(response.body)).toContain('companyName');
    expect(store.snapshot.status.title).toBe('OBSERVED');
    store.duplicates = {};
  });

  it('reenvía el documento de una solicitud observada y el permiso deja de servir', async () => {
    const response = await send(CODE, token, PDF, '203.0.113.17');

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).toContain('PENDING');
    expect(JSON.stringify(response.body)).not.toContain(token);
    expect(store.snapshot.status.title).toBe('PENDING');
    expect(filesRepository.delete).toHaveBeenCalledWith('file-1');
    expect(requestsService.evaluateLetterheadOcr).toHaveBeenCalledWith('request-1');

    const replay = await send(CODE, token, PDF, '203.0.113.17');
    expect(replay.status).toBe(401);
  });

  it('también reabre una solicitud rechazada con su permiso nuevo', async () => {
    store.snapshot = {
      id: 'request-1',
      requestCode: CODE,
      documentFileId: 'file-2',
      reviewedAt: new Date('2026-11-21T09:00:00.000Z'),
      status: { title: 'REJECTED' },
    };
    const rejectedToken = app
      .get(CompanyDocumentCorrectionAuthorizationService)
      .issueFor(store.snapshot);

    expect((await send(CODE, token, PDF, '203.0.113.18')).status).toBe(401);
    const response = await send(CODE, rejectedToken, PDF, '203.0.113.18');
    expect(response.status).toBe(200);
    expect(store.snapshot.status.title).toBe('PENDING');
  });

  it('limita los intentos por IP y código con 429', async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < COMPANY_PUBLIC_REQUEST_LIMITS.resubmit + 2; attempt += 1) {
      statuses.push((await send(CODE, null, PDF, '203.0.113.99')).status);
    }
    expect(statuses.slice(0, COMPANY_PUBLIC_REQUEST_LIMITS.resubmit).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(COMPANY_PUBLIC_REQUEST_LIMITS.resubmit)).toEqual([429, 429]);

    expect((await send(CODE, null, PDF, '203.0.113.98')).status).toBe(401);
  });
});
