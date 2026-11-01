import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { AuditEventRecorderService } from '../../audit-events/services/audit-event-recorder.service.js';
import { FilesRepository } from '../../files/repositories/files.repository.js';
import { FilesService } from '../../files/services/files.service.js';
import { MAX_FILE_SIZE_BYTES } from '../../files/constants/file-rules.constants.js';
import { DocumentCorrectionController } from '../controllers/document-correction.controller.js';
import { DocumentCorrectionConflictException } from '../exceptions/document-correction-conflict.exception.js';
import { DocumentCorrectionUnauthorizedException } from '../exceptions/document-correction-unauthorized.exception.js';
import { DocumentCorrectionGuard } from '../guards/document-correction.guard.js';
import { DocumentCorrectionRepository } from '../repositories/document-correction.repository.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';
import { DocumentCorrectionAuthorizationService } from '../services/document-correction-authorization.service.js';
import { DocumentReadingService } from '../services/document-reading.service.js';
import { DocumentCorrectionService } from '../services/document-correction.service.js';
import type { ReplaceRejectedDocumentOperation } from '../types/document-correction.types.js';
import type { DocumentCorrectionRequest } from '../types/document-correction-request.types.js';
import { createDocumentCorrectionToken } from '../helpers/document-correction-token.js';
import { CORRECTION_TEST_CODE, CORRECTION_TEST_SECRET, correctedFile, correctionContext, correctionSnapshot } from './document-correction.fixture.js';

const PATH = `/api/access-requests/${CORRECTION_TEST_CODE}/resubmit`;
const TOKEN = createDocumentCorrectionToken(correctionContext(), CORRECTION_TEST_SECRET);
const PDF = Buffer.from('%PDF-1');

describe('Reenvío HTTP del documento rechazado', () => {
  const repository = { findById: vi.fn(), findByCode: vi.fn(), replaceRejectedDocument: vi.fn() };
  const fileRepository = { create: vi.fn() };
  const audit = { record: vi.fn() };
  const validation = { queue: vi.fn() };
  const config = { get: vi.fn() };
  const tx = {} as Prisma.TransactionClient;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentCorrectionController],
      providers: [
        { provide: DocumentReadingService, useValue: { scheduleReading: vi.fn() } },
        DocumentCorrectionGuard, DocumentCorrectionAuthorizationService, DocumentCorrectionService, FilesService,
        { provide: DocumentCorrectionRepository, useValue: repository },
        { provide: FilesRepository, useValue: fileRepository },
        { provide: AuditEventRecorderService, useValue: audit },
        { provide: DocumentValidationRepository, useValue: validation },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    vi.resetAllMocks();
    config.get.mockReturnValue(CORRECTION_TEST_SECRET);
    repository.findById.mockResolvedValue(correctionSnapshot());
    repository.findByCode.mockResolvedValue(correctionSnapshot());
    fileRepository.create.mockResolvedValue(correctedFile());
    audit.record.mockResolvedValue({ id: 'audit-1' });
    validation.queue.mockResolvedValue({ id: 'validation-1' });
    repository.replaceRejectedDocument.mockImplementation(async (operation: ReplaceRejectedDocumentOperation) => {
      const file = await operation.createFile(tx);
      await operation.onReplaced(correctionSnapshot(), file, tx);
      return { requestCode: operation.context.requestCode, status: 'pending' };
    });
  });

  it('registra el envío con el permiso correcto y conserva el contrato JSON del proyecto', async () => {
    const response = await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(200);
    expect(response.body).toMatchObject({ statusCode: 200, ok: true, data: { requestCode: CORRECTION_TEST_CODE, status: 'pending' } });
    expect(fileRepository.create).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect(validation.queue).toHaveBeenCalledTimes(1);
    expect(response.body.data).not.toHaveProperty('token');
    expect(response.body.data).not.toHaveProperty('content');
  });

  it('código y correo sin permiso no autorizan la carga', async () => {
    const response = await request(app.getHttpServer()).post(PATH).query({ email: 'ana@example.com' })
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(401);
    expect(response.body).toMatchObject({ ok: false, data: null, code: 'DOCUMENT_CORRECTION_UNAUTHORIZED' });
    expect(repository.replaceRejectedDocument).not.toHaveBeenCalled();
    expect(fileRepository.create).not.toHaveBeenCalled();
  });

  it.each(['session.jwt.token', `dcr1.${'x'.repeat(43)}`])('rechaza un permiso incorrecto o una sesión ajena: %s', async (token) => {
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${token}`)
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(401);
    expect(repository.replaceRejectedDocument).not.toHaveBeenCalled();
  });

  it('una solicitud inexistente responde con el mismo error sin datos personales', async () => {
    repository.findByCode.mockResolvedValue(null);
    const response = await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(401);
    expect(JSON.stringify(response.body)).not.toMatch(/Ana|Pérez|example.com|file-old/);
    expect(response.body.detail).toBe('No se pudo autorizar la corrección de la solicitud.');
  });

  it.each(['draft', 'pending', 'in_review', 'approved'])('bloquea el reenvío en estado %s', async (status) => {
    repository.findByCode.mockResolvedValue(correctionSnapshot({ status: { title: status } }));
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(401);
    expect(fileRepository.create).not.toHaveBeenCalled();
  });

  it('falta de archivo devuelve un error controlado sin reservar la operación', async () => {
    const response = await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').expect(400);
    expect(response.body.ok).toBe(false);
    expect(repository.replaceRejectedDocument).not.toHaveBeenCalled();
  });

  it.each([
    { content: Buffer.alloc(0), name: 'empty.pdf' },
    { content: Buffer.from('MZ executable'), name: 'false.pdf' },
  ])('valida el contenido del archivo $name', async ({ content, name }) => {
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', content, name).expect(400);
    expect(fileRepository.create).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('rechaza archivos de más de 10 MB antes de intentar persistirlos', async () => {
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', Buffer.alloc(MAX_FILE_SIZE_BYTES + 1), 'big.pdf').expect(413);
    expect(repository.replaceRejectedDocument).not.toHaveBeenCalled();
    expect(fileRepository.create).not.toHaveBeenCalled();
  });

  it.each(['', 'another_type'])('valida el tipo documental %j', async (documentType) => {
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', documentType).attach('file', PDF, 'titulo.pdf').expect(400);
    expect(repository.replaceRejectedDocument).not.toHaveBeenCalled();
  });

  it('si falla el almacenamiento permite reintentar con el mismo permiso', async () => {
    fileRepository.create.mockRejectedValueOnce(new Error('storage failed'));
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(500);
    expect(audit.record).not.toHaveBeenCalled();
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(200);
  });

  it('la revisión concurrente devuelve conflicto y no devuelve detalles internos', async () => {
    repository.replaceRejectedDocument.mockRejectedValueOnce(new DocumentCorrectionConflictException());
    await request(app.getHttpServer()).post(PATH).set('Authorization', `Bearer ${TOKEN}`)
      .field('documentType', 'national_title').attach('file', PDF, 'titulo.pdf').expect(409);
    expect(fileRepository.create).not.toHaveBeenCalled();
  });

  it('no ofrece una ruta pública para emitir permisos con código y correo', async () => {
    await request(app.getHttpServer()).post(`/api/access-requests/${CORRECTION_TEST_CODE}/correction-token`)
      .send({ email: 'ana@example.com' }).expect(404);
  });

  it('Swagger documenta multipart, autorización y respuesta pendiente', () => {
    const doc = SwaggerModule.createDocument(app, new DocumentBuilder().addBearerAuth().build());
    const operation = doc.paths['/api/access-requests/{code}/resubmit'].post;
    expect(operation?.security).toEqual([{ bearer: [] }]);
    expect(operation?.requestBody).toHaveProperty('content.multipart/form-data');
    expect(operation?.responses).toHaveProperty('200');
    expect(operation?.responses).toHaveProperty('401');
    expect(operation?.responses).toHaveProperty('409');
  });

  it('el controlador no permite ejecutar la corrección sin contexto del guard', () => {
    const correction = { resubmit: vi.fn() };
    const controller = new DocumentCorrectionController(correction as unknown as DocumentCorrectionService);
    expect(() => controller.resubmit({} as DocumentCorrectionRequest, undefined, { documentType: 'national_title' }))
      .toThrow(DocumentCorrectionUnauthorizedException);
    expect(correction.resubmit).not.toHaveBeenCalled();
  });
});
