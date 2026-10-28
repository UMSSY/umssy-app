import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AccessRequestsModule } from '../access-requests.module.js';
import { AccessRequestAutomationController } from '../controllers/access-request-automation.controller.js';
import { toValidationDetail, toValidationSummary } from '../mappers/document-validation.mapper.js';
import { listAccessRequestsQuerySchema } from '../requests/list-access-requests.schema.js';
import { AccessRequestsService } from '../services/access-requests.service.js';
import { AutomaticValidationService } from '../services/automatic-validation.service.js';

describe('AccessRequestAutomationController', () => {
  const build = () => {
    const validation = { getSummary: vi.fn().mockResolvedValue({ manualReviewCount: 5 }), revertApproval: vi.fn().mockResolvedValue({ status: 'in_review' }) };
    const timeline = { listForRequest: vi.fn().mockResolvedValue([]) };
    return { validation, timeline, controller: new AccessRequestAutomationController(validation as any, timeline as any) };
  };

  it('exige sesión y el rol administrativo', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AccessRequestAutomationController)).toEqual(['administrativo']);
    expect(Reflect.getMetadata('__guards__', AccessRequestAutomationController)).toHaveLength(2);
  });

  it('delega métricas, historial y reversión con el administrativo autenticado', async () => {
    const { validation, timeline, controller } = build();
    await expect(controller.getSummary()).resolves.toEqual({ manualReviewCount: 5 });
    await expect(controller.getHistory('req-1')).resolves.toEqual([]);
    expect(timeline.listForRequest).toHaveBeenCalledWith('req-1');
    await controller.revertApproval('req-1', { id: 'admin-1' } as any);
    expect(validation.revertApproval).toHaveBeenCalledWith('req-1', 'admin-1');
  });
});

describe('AccessRequestsService.submit: cola de lectura OCR', () => {
  it('CA9: al enviar registra el evento y deja la solicitud en cola dentro de la misma transacción', async () => {
    const tx = {};
    const repository = {
      findById: vi.fn().mockResolvedValue({ id: 'req-1', email: 'a@b.test', idCardNumber: '1', sisCode: '2', documentFileId: 'f', documentType: { title: 'academic_diploma' }, status: { title: 'draft' } }),
      findActiveDuplicates: vi.fn().mockResolvedValue([]),
      submitWithGeneratedCode: vi.fn(async (_id: string, hook: (source: unknown, client: unknown) => Promise<void>) => {
        await hook({ id: 'req-1', requestCode: 'SOL-1', firstName: 'A', lastName: 'B', documentFileId: 'f', career: { title: 'C' }, documentType: null }, tx);
        return { id: 'req-1', requestCode: 'SOL-1', status: { title: 'pending' }, submittedAt: new Date('2026-10-24T15:00:00Z') };
      }),
    };
    const auth = { existsByEmail: vi.fn().mockResolvedValue(false) };
    const recorder = { record: vi.fn().mockResolvedValue({}) };
    const validations = { queue: vi.fn().mockResolvedValue({}) };
    const documentReading = { scheduleReading: vi.fn() };
    const service = new AccessRequestsService(repository as any, auth as any, {} as any, {} as any, {} as any, recorder as any, validations as any, documentReading as any);

    await service.submit('req-1');

    expect(recorder.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'submitted' }), tx);
    expect(validations.queue).toHaveBeenCalledWith('req-1', tx);
    expect(documentReading.scheduleReading).toHaveBeenCalledWith('req-1');
  });
});

describe('document-validation.mapper', () => {
  it('resume el resultado para la bandeja y lo deja en null si no hay lectura', () => {
    expect(toValidationSummary({ result: 'auto_approved', matchScore: 98, reason: null })).toEqual({ result: 'auto_approved', matchScore: 98, reason: null });
    expect(toValidationSummary(null)).toBeNull();
  });

  it('CA6: une lo leído con lo declarado para la tabla de contraste', () => {
    const detail = toValidationDetail(
      {
        result: 'manual_review',
        matchScore: 61,
        reason: 'El apellido no coincide',
        fieldResults: [
          { field: 'fullName', read: 'María Quispe Rojas', result: 'mismatch' },
          { field: 'sisCode', read: null, result: 'not_compared' },
        ],
        readAt: new Date('2026-10-24T15:00:00Z'),
        revertedAt: null,
        revertedBy: null,
      },
      { fullName: 'María Quispe Mamani', career: 'C', graduationYear: '2019', idCardNumber: '1', sisCode: '201502277' },
    );
    expect(detail).toEqual({
      result: 'manual_review',
      matchScore: 61,
      reason: 'El apellido no coincide',
      readAt: '2026-10-24T15:00:00.000Z',
      revertedAt: null,
      revertedBy: null,
      fields: [
        { field: 'fullName', declared: 'María Quispe Mamani', read: 'María Quispe Rojas', result: 'mismatch' },
        { field: 'sisCode', declared: '201502277', read: null, result: 'not_compared' },
      ],
    });
    expect(toValidationDetail(null, {} as never)).toBeNull();
  });

  it('una lectura en cola todavía no tiene campos comparados', () => {
    const detail = toValidationDetail(
      { result: 'queued', matchScore: null, reason: null, fieldResults: null, readAt: null, revertedAt: null, revertedBy: { firstName: 'Carla', lastName: 'Montaño' } },
      {} as never,
    );
    expect(detail).toMatchObject({ result: 'queued', fields: [], revertedBy: 'Carla Montaño' });
  });
});

describe('listAccessRequestsQuerySchema: filtro de validación automática', () => {
  it('CA12: acepta los tipos de dictamen y rechaza otros valores', () => {
    expect(listAccessRequestsQuerySchema.parse({ validation: 'auto_approved' }).validation).toBe('auto_approved');
    expect(listAccessRequestsQuerySchema.parse({ validation: '' }).validation).toBeUndefined();
    const result = listAccessRequestsQuerySchema.safeParse({ validation: 'otra' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('La validación automática no es válida');
  });
});

describe('AccessRequestsModule', () => {
  beforeAll(() => vi.stubEnv('JWT_SECRET', 'test-secret'));
  afterAll(() => vi.unstubAllEnvs());

  it.each([AccessRequestAutomationController, AutomaticValidationService])('resuelve %o', async (provider) => {
    const moduleRef = await Test.createTestingModule({ imports: [AccessRequestsModule, PrismaModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    expect(moduleRef.get(provider)).toBeInstanceOf(provider);
  });
});
