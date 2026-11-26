import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { buildCompanyCorrectionUrl } from '../helpers/build-company-correction-url.js';
import { CompanyAccessRequestsService } from '../services/company-access-requests.service.js';

const TOKEN = `ccr1.${'A'.repeat(43)}`;

describe('enlace de corrección en los correos de empresa', () => {
  const repository = {
    findById: vi.fn(),
    observeCompanyRequest: vi.fn(),
    rejectCompanyRequest: vi.fn(),
    findByCodeAndEmail: vi.fn(),
  };
  const notificationsService = { notify: vi.fn() };
  const correctionAuthorization = { issueFor: vi.fn() };
  let service: CompanyAccessRequestsService;

  const current = {
    id: 'req-1',
    companyName: 'Acme',
    email: 'acme@test.com',
    requestCode: 'EMP-2026-0001',
    status: { title: 'IN_REVIEW' },
  };
  const reviewedAt = new Date('2026-11-20T15:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
    correctionAuthorization.issueFor.mockReturnValue(TOKEN);
    repository.findById.mockResolvedValue(current);
    notificationsService.notify.mockResolvedValue({
      inAppCount: 0,
      pushStatus: 'skipped',
      emailStatus: 'sent',
      deliveries: [],
    });
    service = new CompanyAccessRequestsService(
      repository as never,
      {} as never,
      {} as never,
      notificationsService as never,
      correctionAuthorization as never,
    );
  });

  function sentNotification() {
    return notificationsService.notify.mock.calls[0][0] as {
      actionUrl: string;
      payload: { requestStatusUrl: string; reason: string };
      recipientIds: string[];
      channels: string[];
    };
  }

  it('la observación manda el token solo en el fragmento del enlace del correo', async () => {
    repository.observeCompanyRequest.mockResolvedValue({
      id: 'req-1',
      documentFileId: 'file-1',
      reviewedAt,
      status: { title: 'OBSERVED' },
    });

    await service.requestCorrection('req-1', 'admin-1', {
      reasonCategory: 'Documento',
      customDetails: 'Subir carta nítida con sello legible',
    });

    expect(correctionAuthorization.issueFor).toHaveBeenCalledWith({
      id: 'req-1',
      requestCode: 'EMP-2026-0001',
      documentFileId: 'file-1',
      reviewedAt,
      status: { title: 'OBSERVED' },
    });
    const sent = sentNotification();
    const url = new URL(sent.payload.requestStatusUrl);
    expect(url.pathname).toBe('/request-access/status');
    expect(url.searchParams.get('code')).toBe('EMP-2026-0001');
    expect(url.searchParams.get('email')).toBe('acme@test.com');
    expect(url.search).not.toContain(TOKEN);
    expect(url.hash).toBe(`#token=${TOKEN}`);
  });

  it('el rechazo manda el token solo en el fragmento y no lo guarda en la notificación', async () => {
    repository.rejectCompanyRequest.mockResolvedValue({
      id: 'req-1',
      documentFileId: 'file-1',
      reviewedAt,
      rejectionReason: 'Firma no válida',
    });

    await service.reject('req-1', 'admin-1', 'Firma no válida');

    expect(correctionAuthorization.issueFor).toHaveBeenCalledWith(
      expect.objectContaining({ status: { title: 'REJECTED' }, documentFileId: 'file-1', reviewedAt }),
    );
    const sent = sentNotification();
    expect(new URL(sent.payload.requestStatusUrl).hash).toBe(`#token=${TOKEN}`);
    expect(sent.actionUrl).not.toContain(TOKEN);
    expect(sent.actionUrl).not.toContain('token');
    expect(sent.recipientIds).toEqual([]);
    expect(sent.channels).toEqual(['EMAIL']);
    expect(sent.payload.reason).not.toContain(TOKEN);
  });

  it('el token no aparece en el actionUrl ni en el tipo de notificación de la observación', async () => {
    repository.observeCompanyRequest.mockResolvedValue({
      id: 'req-1',
      documentFileId: null,
      reviewedAt,
    });

    await service.requestCorrection('req-1', 'admin-1', {
      reasonCategory: 'Documento',
      customDetails: 'Subir carta nítida con sello legible',
    });

    const sent = sentNotification();
    expect(sent.actionUrl).not.toContain(TOKEN);
    expect(notificationsService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED }),
    );
  });

  describe('getStatus', () => {
    const found = (title: string, rejectionReason: string | null) => ({
      requestCode: 'EMP-2026-0001',
      companyName: 'Acme',
      status: { title },
      submittedAt: new Date('2026-11-16T12:00:00Z'),
      reviewedAt,
      rejectionReason,
    });

    it('en OBSERVED expone el motivo y permite reenviar', async () => {
      repository.findByCodeAndEmail.mockResolvedValue(found('OBSERVED', '[Documento] Carta ilegible'));
      const res = await service.getStatus('EMP-2026-0001', 'acme@test.com');
      expect(res).toMatchObject({
        status: 'OBSERVED',
        reason: '[Documento] Carta ilegible',
        canResubmit: true,
        rejectionReason: null,
      });
    });

    it('en REJECTED expone el motivo, conserva rejectionReason y permite reenviar', async () => {
      repository.findByCodeAndEmail.mockResolvedValue(found('REJECTED', 'Firma no válida'));
      const res = await service.getStatus('EMP-2026-0001', 'acme@test.com');
      expect(res).toMatchObject({
        status: 'REJECTED',
        reason: 'Firma no válida',
        rejectionReason: 'Firma no válida',
        canResubmit: true,
      });
    });

    it.each(['PENDING', 'IN_REVIEW', 'APPROVED'])('en %s no expone motivo ni permite reenviar', async (title) => {
      repository.findByCodeAndEmail.mockResolvedValue(found(title, 'texto previo'));
      const res = await service.getStatus('EMP-2026-0001', 'acme@test.com');
      expect(res).toMatchObject({ reason: null, canResubmit: false, rejectionReason: null });
    });
  });
});

describe('buildCompanyCorrectionUrl', () => {
  it('pone código y correo en la consulta y el token en el fragmento', () => {
    const url = new URL(buildCompanyCorrectionUrl('EMP-2026-0001', 'a+b@test.com', TOKEN));
    expect(url.pathname).toBe('/request-access/status');
    expect(url.searchParams.get('email')).toBe('a+b@test.com');
    expect(url.searchParams.get('code')).toBe('EMP-2026-0001');
    expect(url.hash).toBe(`#token=${TOKEN}`);
    expect(url.search).not.toContain('token');
  });
});
