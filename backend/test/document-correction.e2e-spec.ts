import { randomInt, randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaModule } from '../src/common/prisma/prisma.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor.js';
import { AuditEventsRepository } from '../src/modules/audit-events/repositories/audit-events.repository.js';
import { AuditEventRecorderService } from '../src/modules/audit-events/services/audit-event-recorder.service.js';
import { FilesRepository } from '../src/modules/files/repositories/files.repository.js';
import { FilesService } from '../src/modules/files/services/files.service.js';
import { DocumentCorrectionController } from '../src/modules/access-requests/controllers/document-correction.controller.js';
import { DocumentCorrectionGuard } from '../src/modules/access-requests/guards/document-correction.guard.js';
import { DocumentCorrectionRepository } from '../src/modules/access-requests/repositories/document-correction.repository.js';
import { DocumentValidationRepository } from '../src/modules/access-requests/repositories/document-validation.repository.js';
import { DocumentCorrectionAuthorizationService } from '../src/modules/access-requests/services/document-correction-authorization.service.js';
import { DocumentCorrectionService } from '../src/modules/access-requests/services/document-correction.service.js';

// Opt-in: utiliza PostgreSQL real, solo con una base de pruebas identificada.
// No ejecuta migraciones, no vacía tablas ni envía correos.
const enabled = process.env.RUN_B2_DB_TESTS === '1';
const describeDatabase = enabled ? describe : describe.skip;
const RUN_TAG = `b2-correction-${randomUUID()}`;
const TEST_SECRET = 'isolated-database-correction-test-key';
const PDF = Buffer.from('%PDF-1.4\ncorregido\n');

describeDatabase('B2: persistencia y concurrencia reales de la corrección', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let files: FilesService;
  let authorization: DocumentCorrectionAuthorizationService;
  let audit: AuditEventRecorderService;
  let careerId: string;
  const requestIds: string[] = [];

  beforeAll(async () => {
    const dbName = process.env.DB_NAME ?? '';
    if (!/^(.+[_-])?test([_-].+)?$/i.test(dbName)) {
      throw new Error('B2 requiere una base aislada cuyo DB_NAME contenga el segmento test. Configura .env.test con DevOps; no uses la base de desarrollo ni producción.');
    }
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [DocumentCorrectionController],
      providers: [
        DocumentCorrectionGuard, DocumentCorrectionRepository, DocumentCorrectionAuthorizationService,
        DocumentCorrectionService, DocumentValidationRepository, FilesRepository, FilesService,
        AuditEventsRepository, AuditEventRecorderService,
        { provide: ConfigService, useValue: { get: (name: string) => name === 'JWT_SECRET' ? TEST_SECRET : undefined } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    prisma = app.get(PrismaService);
    files = app.get(FilesService);
    authorization = app.get(DocumentCorrectionAuthorizationService);
    audit = app.get(AuditEventRecorderService);

    const [career, rejected, pending, type] = await Promise.all([
      prisma.career.findFirst({ select: { id: true } }),
      prisma.accessRequestStatus.findUnique({ where: { title: 'rejected' } }),
      prisma.accessRequestStatus.findUnique({ where: { title: 'pending' } }),
      prisma.accessRequestDocumentType.findUnique({ where: { title: 'national_title' } }),
    ]);
    if (!career || !rejected || !pending || !type) {
      throw new Error('Faltan catálogos existentes en la base de pruebas; coordina su preparación con DevOps. Este test no modifica el esquema ni ejecuta seeds.');
    }
    careerId = career.id;
  }, 30_000);

  afterEach(async () => {
    vi.restoreAllMocks();
    if (!prisma) return;
    if (requestIds.length > 0) {
      await prisma.auditEvent.deleteMany({ where: { accessRequestId: { in: [...requestIds] } } });
      await prisma.documentValidation.deleteMany({ where: { accessRequestId: { in: [...requestIds] } } });
      await prisma.accessRequest.deleteMany({ where: { id: { in: [...requestIds] } } });
      requestIds.length = 0;
    }
    await prisma.file.deleteMany({ where: { name: { startsWith: RUN_TAG } } });
  });

  afterAll(async () => { if (app) await app.close(); });

  async function fixture() {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
    const previous = await files.create({ name: `${RUN_TAG}-old-${suffix}.pdf`, content: Buffer.from('%PDF-anterior') });
    const row = await prisma.accessRequest.create({
      data: {
        requestCode: `SOL-2026-${randomInt(10_000_000, 99_999_999)}`,
        firstName: 'Prueba', lastName: 'Corrección',
        idCardNumber: suffix, idCardIssuedIn: 'CB', sisCode: suffix,
        email: `${RUN_TAG}-${suffix}@example.invalid`, phone: '70000000',
        birthDate: new Date('1990-01-01'), graduationYear: 2020,
        career: { connect: { id: careerId } },
        status: { connect: { title: 'rejected' } },
        documentType: { connect: { title: 'national_title' } },
        documentFile: { connect: { id: previous.id } },
        submittedAt: new Date('2026-10-01T12:00:00.000Z'),
        reviewedAt: new Date('2026-10-02T12:00:00.000Z'), rejectionReason: 'Documento ilegible',
      },
    });
    requestIds.push(row.id);
    const grant = await authorization.issueFor(row.id);
    return { row, previous, grant };
  }

  function send(code: string, token: string, content: Buffer = PDF) {
    return request(app.getHttpServer()).post(`/api/access-requests/${code}/resubmit`)
      .set('Authorization', `Bearer ${token}`).field('documentType', 'national_title')
      .attach('file', content, `${RUN_TAG}-new-${randomUUID()}.pdf`);
  }

  async function assertUnchanged(id: string, previousId: string, revision: Date) {
    const row = await prisma.accessRequest.findUniqueOrThrow({ where: { id }, include: { status: true } });
    expect(row.status.title).toBe('rejected');
    expect(row.documentFileId).toBe(previousId);
    expect(row.updatedAt).toEqual(revision);
    expect(await prisma.auditEvent.count({ where: { accessRequestId: id } })).toBe(0);
  }

  it('conserva ID y código, protege la evidencia anterior y registra un solo evento y una revisión nueva', async () => {
    const { row, previous, grant } = await fixture();
    await send(grant.requestCode, grant.token).expect(200);
    const saved = await prisma.accessRequest.findUniqueOrThrow({ where: { id: row.id }, include: { status: true, documentValidation: true } });
    expect(saved.requestCode).toBe(row.requestCode);
    expect(saved.email).toBe(row.email);
    expect(saved.submittedAt).toEqual(row.submittedAt);
    expect(saved.status.title).toBe('pending');
    expect(saved.documentFileId).not.toBe(previous.id);
    expect(saved.rejectionReason).toBeNull();
    expect(saved.documentValidation?.result).toBe('queued');
    const events = await prisma.auditEvent.findMany({ where: { accessRequestId: row.id }, include: { action: true } });
    expect(events).toHaveLength(1);
    expect(events[0].action.title).toBe('document_replaced');
    expect(events[0].evidenceFileId).toBe(previous.id);
    expect(events[0].detail).toContain(saved.documentFileId);
    expect((await files.getContent(previous.id)).content).toEqual(Buffer.from('%PDF-anterior'));
    await expect(files.delete(previous.id)).rejects.toBeDefined();
    expect(await prisma.accessRequest.count({ where: { email: row.email } })).toBe(1);
    await send(grant.requestCode, grant.token).expect(401);
  });

  it('un archivo inválido revierte estado y revisión, permitiendo reutilizar el permiso', async () => {
    const { row, previous, grant } = await fixture();
    await send(grant.requestCode, grant.token, Buffer.from('MZ invalid')).expect(400);
    await assertUnchanged(row.id, previous.id, row.updatedAt);
    expect(await prisma.file.count({ where: { name: { startsWith: RUN_TAG } } })).toBe(1);
    await send(grant.requestCode, grant.token).expect(200);
  });

  it('un fallo de auditoría revierte también el archivo nuevo y no consume el permiso', async () => {
    const { row, previous, grant } = await fixture();
    const spy = vi.spyOn(audit, 'record').mockRejectedValueOnce(new Error('simulated audit failure'));
    await send(grant.requestCode, grant.token).expect(500);
    spy.mockRestore();
    await assertUnchanged(row.id, previous.id, row.updatedAt);
    expect(await prisma.file.count({ where: { name: { startsWith: RUN_TAG } } })).toBe(1);
    await send(grant.requestCode, grant.token).expect(200);
  });

  it('dos envíos concurrentes solo guardan un archivo nuevo y un evento', async () => {
    const { row, previous, grant } = await fixture();
    const responses = await Promise.all([send(grant.requestCode, grant.token), send(grant.requestCode, grant.token)]);
    expect(responses.filter((result) => result.status === 200)).toHaveLength(1);
    expect(responses.filter((result) => [401, 409].includes(result.status))).toHaveLength(1);
    expect(await prisma.file.count({ where: { name: { startsWith: RUN_TAG } } })).toBe(2);
    expect(await prisma.auditEvent.count({ where: { accessRequestId: row.id } })).toBe(1);
    expect(await prisma.file.findUnique({ where: { id: previous.id } })).not.toBeNull();
  });

  it('un rechazo posterior necesita otro permiso y conserva todas las versiones documentales', async () => {
    const { row, previous, grant } = await fixture();
    await send(grant.requestCode, grant.token).expect(200);
    const first = await prisma.accessRequest.findUniqueOrThrow({ where: { id: row.id } });
    await prisma.accessRequest.update({
      where: { id: row.id },
      data: { status: { connect: { title: 'rejected' } }, rejectionReason: 'Segunda observación', reviewedAt: new Date() },
    });
    await send(grant.requestCode, grant.token).expect(401);
    const next = await authorization.issueFor(row.id);
    expect(next.token).not.toBe(grant.token);
    await send(next.requestCode, next.token).expect(200);
    const events = await prisma.auditEvent.findMany({ where: { accessRequestId: row.id } });
    expect(new Set(events.map((event) => event.evidenceFileId))).toEqual(new Set([previous.id, first.documentFileId]));
    expect(await prisma.file.count({ where: { name: { startsWith: RUN_TAG } } })).toBe(3);
  });

  it('un permiso de otra solicitud no modifica ninguna de las dos', async () => {
    const first = await fixture();
    const second = await fixture();
    await send(second.grant.requestCode, first.grant.token).expect(401);
    await assertUnchanged(first.row.id, first.previous.id, first.row.updatedAt);
    await assertUnchanged(second.row.id, second.previous.id, second.row.updatedAt);
  });
});
