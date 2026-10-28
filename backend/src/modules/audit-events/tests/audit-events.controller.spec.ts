import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { AuditEventsModule } from '../audit-events.module.js';
import { AuditEventsController } from '../controllers/audit-events.controller.js';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';
import { AuditEventsService } from '../services/audit-events.service.js';

describe('AuditEventsController', () => {
  const build = () => {
    const service = { list: vi.fn().mockResolvedValue('lista'), listResponsibles: vi.fn().mockResolvedValue([]), getDocument: vi.fn() };
    return { service, controller: new AuditEventsController(service as any, {} as any) };
  };

  it('exige sesión y el rol administrativo en toda la ruta', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AuditEventsController)).toEqual(['administrativo']);
    expect(Reflect.getMetadata('__guards__', AuditEventsController)).toHaveLength(2);
  });

  it('solo expone consultas GET: no hay rutas para crear, editar ni borrar eventos', () => {
    const methods = Object.getOwnPropertyNames(AuditEventsController.prototype).filter((name) => name !== 'constructor');
    for (const name of methods) {
      expect(Reflect.getMetadata('method', (AuditEventsController.prototype as any)[name])).toBe(0);
    }
  });

  it('delegan el listado y los responsables en el servicio', async () => {
    const { service, controller } = build();
    await expect(controller.list({ page: 1, limit: 10 })).resolves.toBe('lista');
    expect(service.list).toHaveBeenCalledWith({ page: 1, limit: 10 });
    await expect(controller.listResponsibles()).resolves.toEqual([]);
  });

  it('sirve la evidencia con su tipo, nombre y sin caché', async () => {
    const { service, controller } = build();
    const content = Buffer.from('%PDF-1.7');
    service.getDocument.mockResolvedValue({ name: 'diploma académico', extension: 'pdf', mimeType: 'application/pdf', content });
    const response = { set: vi.fn(), end: vi.fn() };

    await controller.getDocument('evt-1', response);

    expect(service.getDocument).toHaveBeenCalledWith('evt-1');
    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Length': String(content.length),
      'Content-Disposition': "inline; filename*=UTF-8''diploma%20acad%C3%A9mico.pdf",
      'Cache-Control': 'private, no-store',
    });
    expect(response.end).toHaveBeenCalledWith(content);
  });
});

describe('AuditEventsModule', () => {
  beforeAll(() => vi.stubEnv('JWT_SECRET', 'test-secret'));
  afterAll(() => vi.unstubAllEnvs());

  it.each([AuditEventsController, AuditEventsService, AuditEventsRepository])('resuelve %o', async (provider) => {
    const moduleRef = await Test.createTestingModule({ imports: [AuditEventsModule, PrismaModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    expect(moduleRef.get(provider)).toBeInstanceOf(provider);
  });
});
