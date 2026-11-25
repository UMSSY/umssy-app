import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { CompanyAccessRequestsService } from '../services/company-access-requests.service.js';
import { CompanyRegistrationConflictException } from '../exceptions/company-registration-conflict.exception.js';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';

describe('CompanyAccessRequestsService', () => {
  let service: CompanyAccessRequestsService;

  const repository = {
    listCities: vi.fn(),
    findDuplicates: vi.fn(),
    createDraft: vi.fn(),
    findById: vi.fn(),
    setLogo: vi.fn(),
    setDocument: vi.fn(),
    submitWithGeneratedCode: vi.fn(),
    saveOcrResult: vi.fn(),
    markInReview: vi.fn(),
    findPage: vi.fn(),
    getSummary: vi.fn(),
    approveCompanyRequest: vi.fn(),
    rejectCompanyRequest: vi.fn(),
    observeCompanyRequest: vi.fn(),
    findByCodeAndEmail: vi.fn(),
    activateRecruiterAccount: vi.fn(),
    findByEmailForActivation: vi.fn(),
    recordInconsistencyReport: vi.fn(),
    findCompanyLogo: vi.fn(),
    updateData: vi.fn(),
  };

  const filesService = {
    create: vi.fn(),
    getContent: vi.fn(),
    delete: vi.fn(),
  };

  const companyOcr = {
    analyze: vi.fn(),
    evaluateDocumentText: vi.fn(),
  };

  const notificationsService = {
    notify: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CompanyAccessRequestsService(
      repository as any,
      filesService as any,
      companyOcr as any,
      notificationsService as any,
    );
  });

  describe('listCities', () => {
    it('retorna la lista de ciudades del repositorio', async () => {
      repository.listCities.mockResolvedValue([{ id: 'c-1', name: 'Cochabamba' }]);
      await expect(service.listCities()).resolves.toEqual([{ id: 'c-1', name: 'Cochabamba' }]);
      expect(repository.listCities).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    const dto = {
      companyName: 'Acme Corp',
      sector: 'Tecnología',
      cityId: 'c-1',
      description: 'Software cloud',
      email: 'acme@test.com',
      phone: '71234567',
      websiteUrl: 'https://acme.com',
      username: 'acme_user',
    };

    it('detecta conflicto si la empresa ya existe', async () => {
      repository.findDuplicates.mockResolvedValue({
        existingCompany: { id: 'comp-1' },
        existingUser: null,
        activeRequest: null,
      });
      await expect(service.create(dto)).rejects.toThrow(CompanyRegistrationConflictException);
    });

    it('detecta conflicto si el correo o usuario ya existe', async () => {
      repository.findDuplicates.mockResolvedValue({
        existingCompany: null,
        existingUser: { id: 'usr-1' },
        activeRequest: null,
      });
      await expect(service.create(dto)).rejects.toThrow(CompanyRegistrationConflictException);
    });

    it('detecta conflicto si ya hay solicitud en trámite', async () => {
      repository.findDuplicates.mockResolvedValue({
        existingCompany: null,
        existingUser: null,
        activeRequest: { companyName: 'Acme Corp', email: 'acme@test.com' },
      });
      await expect(service.create(dto)).rejects.toThrow(CompanyRegistrationConflictException);
    });

    it('crea borrador exitosamente si no hay conflictos', async () => {
      repository.findDuplicates.mockResolvedValue({
        existingCompany: null,
        existingUser: null,
        activeRequest: null,
      });
      repository.createDraft.mockResolvedValue({ id: 'req-1' });

      const res = await service.create(dto);
      expect(res).toEqual({ id: 'req-1' });
    });
  });

  describe('attachLogo', () => {
    it('lanza error si no se adjunta archivo', async () => {
      repository.findById.mockResolvedValue({ id: 'req-1', status: { title: 'DRAFT' } });
      await expect(service.attachLogo('req-1', undefined)).rejects.toThrow(BadRequestException);
    });

    it('lanza error si el formato del logo no es imagen permitida', async () => {
      repository.findById.mockResolvedValue({ id: 'req-1', status: { title: 'DRAFT' } });
      const file = { mimetype: 'application/pdf', buffer: Buffer.from(''), originalname: 'doc.pdf' } as any;
      await expect(service.attachLogo('req-1', file)).rejects.toThrow(BadRequestException);
    });

    it('guarda y adjunta logo exitosamente', async () => {
      const file = {
        mimetype: 'image/png',
        buffer: Buffer.from('data'),
        originalname: 'logo.png',
        size: 100,
      } as any;
      repository.findById.mockResolvedValue({ id: 'req-1', status: { title: 'DRAFT' } });
      filesService.create.mockResolvedValue({ id: 'file-logo-1' });
      repository.setLogo.mockResolvedValue(null);

      const res = await service.attachLogo('req-1', file);
      expect(res.logoFileId).toBe('file-logo-1');
      expect(filesService.create).toHaveBeenCalled();
    });
  });

  describe('attachDocument', () => {
    it('lanza error si no se adjunta documento', async () => {
      repository.findById.mockResolvedValue({ id: 'req-1', status: { title: 'DRAFT' } });
      await expect(service.attachDocument('req-1', undefined)).rejects.toThrow(BadRequestException);
    });

    it('guarda documento exitosamente', async () => {
      const file = {
        mimetype: 'application/pdf',
        buffer: Buffer.from('doc-data'),
        originalname: 'carta.pdf',
        size: 200,
      } as any;
      repository.findById.mockResolvedValue({ id: 'req-1', status: { title: 'DRAFT' } });
      filesService.create.mockResolvedValue({ id: 'file-doc-1' });
      repository.setDocument.mockResolvedValue(null);

      const res = await service.attachDocument('req-1', file);
      expect(res.documentFileId).toBe('file-doc-1');
    });
  });

  describe('submit', () => {
    it('lanza error si la solicitud no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.submit('req-none')).rejects.toThrow(NotFoundException);
    });

    it('lanza error si falta adjuntar el documento institucional', async () => {
      repository.findById.mockResolvedValue({
        id: 'req-1',
        status: { title: 'DRAFT' },
        documentFileId: null,
      });
      await expect(service.submit('req-1')).rejects.toThrow(BadRequestException);
    });

    it('envía solicitud y genera código institucional', async () => {
      repository.findById.mockResolvedValue({
        id: 'req-1',
        status: { title: 'DRAFT' },
        documentFileId: 'doc-1',
      });
      repository.submitWithGeneratedCode.mockResolvedValue({
        id: 'req-1',
        requestCode: 'EMP-2026-0001',
        status: { title: 'PENDING' },
        submittedAt: new Date('2026-11-16T12:00:00Z'),
      });

      const res = await service.submit('req-1');
      expect(res.requestCode).toBe('EMP-2026-0001');
      expect(res.status).toBe('PENDING');
      expect(res.submittedAt).toBeDefined();
    });
  });

  describe('getStatus', () => {
    it('lanza NOT_FOUND si no coincide código o correo', async () => {
      repository.findByCodeAndEmail.mockResolvedValue(null);
      await expect(service.getStatus('EMP-1', 'test@test.com')).rejects.toThrow(NotFoundException);
    });

    it('retorna estado y datos de la solicitud', async () => {
      repository.findByCodeAndEmail.mockResolvedValue({
        requestCode: 'EMP-1',
        companyName: 'Acme',
        status: { title: 'PENDING' },
        submittedAt: new Date('2026-11-16T12:00:00Z'),
        reviewedAt: null,
        rejectionReason: null,
      });
      const res = await service.getStatus('EMP-1', 'test@test.com');
      expect(res.status).toBe('PENDING');
      expect(res.companyName).toBe('Acme');
      expect(res.requestCode).toBe('EMP-1');
    });
  });

  describe('approve', () => {
    it('lanza error si la solicitud no está pendiente ni en revisión', async () => {
      repository.findById.mockResolvedValue({
        id: 'req-1',
        status: { title: 'REJECTED' },
      });
      await expect(service.approve('req-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('aprueba la solicitud, genera código y envía correo oficial', async () => {
      repository.findById.mockResolvedValue({
        id: 'req-1',
        companyName: 'Acme',
        email: 'acme@test.com',
        status: { title: 'PENDING' },
      });
      repository.approveCompanyRequest.mockResolvedValue({
        id: 'req-1',
        requestCode: 'EMP-2026-0001',
        approvedCompanyId: 'comp-1',
        approvedUserId: 'usr-1',
      });
      notificationsService.notify.mockResolvedValue({
        inAppCount: 1,
        pushStatus: 'skipped',
        emailStatus: 'sent',
        deliveries: [],
      });

      const res = await service.approve('req-1', 'admin-1');
      expect(res.status).toBe('APPROVED');
      expect(res.activationCodeSent).toBe(true);
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientIds: ['usr-1'],
          actorId: 'admin-1',
          type: NotificationType.COMPANY_ACCESS_REQUEST_APPROVED,
        }),
      );
    });
  });

  describe('approve: resultado real del envío y registros', () => {
    const pendingRequest = {
      id: 'req-1',
      companyName: 'Acme',
      email: 'acme@test.com',
      requestCode: 'EMP-2026-0001',
      status: { title: 'PENDING' },
    };
    const approvedRecord = {
      id: 'req-1',
      requestCode: 'EMP-2026-0001',
      approvedCompanyId: 'comp-1',
      approvedUserId: 'usr-1',
    };
    const delivery = (emailStatus: string) => ({
      inAppCount: 1,
      pushStatus: 'skipped',
      emailStatus,
      deliveries: [],
    });
    let logged: string[];

    beforeEach(() => {
      logged = [];
      for (const method of ['log', 'warn', 'error', 'debug', 'verbose'] as const) {
        vi.spyOn(Logger.prototype, method).mockImplementation((message: unknown) => {
          logged.push(String(message));
        });
      }
      repository.findById.mockResolvedValue(pendingRequest);
      repository.approveCompanyRequest.mockResolvedValue(approvedRecord);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each(['sent', 'partial'])('informa que el código se envió cuando el correo quedó en %s', async (emailStatus) => {
      notificationsService.notify.mockResolvedValue(delivery(emailStatus));

      const res = await service.approve('req-1', 'admin-1');

      expect(res.activationCodeSent).toBe(true);
    });

    it.each(['failed', 'skipped'])('informa que el código no se envió cuando el correo quedó en %s', async (emailStatus) => {
      notificationsService.notify.mockResolvedValue(delivery(emailStatus));

      const res = await service.approve('req-1', 'admin-1');

      expect(res).toMatchObject({ status: 'APPROVED', activationCodeSent: false });
      expect(repository.approveCompanyRequest).toHaveBeenCalledTimes(1);
    });

    it('conserva la aprobación y responde que no se envió cuando notify lanza un error', async () => {
      notificationsService.notify.mockRejectedValue(
        new NotFoundException('NotificationType COMPANY_ACCESS_REQUEST_APPROVED no encontrado en el catálogo'),
      );

      const res = await service.approve('req-1', 'admin-1');

      expect(repository.approveCompanyRequest).toHaveBeenCalledTimes(1);
      expect(res).toEqual({
        id: 'req-1',
        status: 'APPROVED',
        approvedCompanyId: 'comp-1',
        activationCodeSent: false,
      });
      expect(logged.join('\n')).toContain('no encontrado en el catálogo');
    });

    it('registra el error con el identificador de la solicitud y sin el correo ni el código', async () => {
      notificationsService.notify.mockRejectedValue(new Error('SMTP caído'));

      await service.approve('req-1', 'admin-1');

      const activationCode = String(
        (notificationsService.notify.mock.calls.at(-1)?.[0] as { payload: { activationCode: string } }).payload
          .activationCode,
      );
      const warning = logged.find((line) => line.includes('SMTP caído')) ?? '';
      expect(warning).toContain('req-1');
      expect(warning).toContain('EMP-2026-0001');
      expect(warning).not.toContain('acme@test.com');
      expect(warning).not.toContain(activationCode);
    });
  });

  describe('reject y requestCorrection', () => {
    it('rechaza la solicitud con motivo', async () => {
      repository.findById.mockResolvedValue({
        id: 'req-1',
        companyName: 'Acme',
        email: 'acme@test.com',
        requestCode: 'EMP-1',
        status: { title: 'IN_REVIEW' },
      });
      repository.rejectCompanyRequest.mockResolvedValue({
        id: 'req-1',
        status: { title: 'REJECTED' },
        rejectionReason: 'Firma no válida',
      });
      notificationsService.notify.mockResolvedValue({
        inAppCount: 0,
        pushStatus: 'skipped',
        emailStatus: 'sent',
        deliveries: [],
      });

      const res = await service.reject('req-1', 'admin-1', {
        reasonCategory: 'Firma',
        customDetails: 'Firma no válida',
      });
      expect(res.status).toBe('REJECTED');
      expect(res.rejectionReason).toContain('Firma no válida');
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmails: ['acme@test.com'],
          type: NotificationType.COMPANY_ACCESS_REQUEST_REJECTED,
        }),
      );
    });

    it('solicita corrección con categoría y detalle', async () => {
      repository.findById.mockResolvedValue({
        id: 'req-1',
        companyName: 'Acme',
        email: 'acme@test.com',
        requestCode: 'EMP-1',
        status: { title: 'PENDING' },
      });
      repository.observeCompanyRequest.mockResolvedValue({
        id: 'req-1',
        status: { title: 'OBSERVED' },
      });
      notificationsService.notify.mockResolvedValue({
        inAppCount: 0,
        pushStatus: 'skipped',
        emailStatus: 'sent',
        deliveries: [],
      });

      const res = await service.requestCorrection('req-1', 'admin-1', {
        reasonCategory: 'Documento',
        customDetails: 'Subir carta nítida con sello legible',
      });
      expect(res.status.title).toBe('OBSERVED');
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmails: ['acme@test.com'],
          type: NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED,
        }),
      );
    });
  });

  describe('reportInconsistency', () => {
    it('registra reporte de inconsistencia', async () => {
      repository.recordInconsistencyReport.mockResolvedValue({
        id: 'req-1',
      });

      const res = await service.reportInconsistency({
        requestCode: 'EMP-2026-0001',
        email: 'acme@test.com',
        observation: 'Hubo un error en mi razón social',
      });

      expect(res.reported).toBe(true);
    });

    it('lanza NotFoundException si la solicitud no existe', async () => {
      repository.recordInconsistencyReport.mockResolvedValue(null);

      await expect(
        service.reportInconsistency({
          requestCode: 'EMP-NONE',
          email: 'none@test.com',
          observation: 'Error',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary y list', () => {
    it('retorna el resumen numérico', async () => {
      const summary = {
        pendingCount: 5,
        inReviewCount: 2,
        approvedCount: 10,
        rejectedCount: 3,
      };
      repository.getSummary.mockResolvedValue(summary);
      await expect(service.getSummary()).resolves.toEqual(summary);
    });

    it('retorna la lista paginada', async () => {
      const pageResult = { rows: [], total: 0 };
      repository.findPage.mockResolvedValue(pageResult);
      await expect(service.list({ page: 1, limit: 10, status: 'ALL' })).resolves.toEqual(pageResult);
    });
  });
});
