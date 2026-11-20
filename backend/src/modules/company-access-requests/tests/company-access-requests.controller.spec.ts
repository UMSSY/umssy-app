import { describe, expect, it, vi } from 'vitest';
import { CompanyAccessRequestsController } from '../controllers/company-access-requests.controller.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';

describe('CompanyAccessRequestsController', () => {
  const service = {
    listCities: vi.fn(),
    create: vi.fn(),
    attachLogo: vi.fn(),
    attachDocument: vi.fn(),
    submit: vi.fn(),
    getStatus: vi.fn(),
    getActivationStatus: vi.fn(),
    reportInconsistency: vi.fn(),
    activate: vi.fn(),
    getPublicCompanyLogo: vi.fn(),
    list: vi.fn(),
    getSummary: vi.fn(),
    getDetail: vi.fn(),
    getDocument: vi.fn(),
    getLogo: vi.fn(),
    update: vi.fn(),
    reEvaluateOcr: vi.fn(),
    requestCorrection: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  };

  const controller = new CompanyAccessRequestsController(service as any);
  const mockUser: AuthenticatedUser = {
    id: 'user-admin-1',
    roleTag: 'administrativo',
    roles: ['administrativo'],
  };

  it('delega listCities al servicio', async () => {
    service.listCities.mockResolvedValue([{ id: 'c-1', name: 'Cochabamba' }]);
    await expect(controller.listCities()).resolves.toEqual([{ id: 'c-1', name: 'Cochabamba' }]);
  });

  it('delega create al servicio', async () => {
    const body = { companyName: 'Test' } as any;
    service.create.mockResolvedValue({ id: 'req-1' });
    await expect(controller.create(body)).resolves.toEqual({ id: 'req-1' });
    expect(service.create).toHaveBeenCalledWith(body);
  });

  it('delega attachLogo al servicio', async () => {
    const file = { originalname: 'logo.png', buffer: Buffer.from('') } as any;
    service.attachLogo.mockResolvedValue({ id: 'req-1', hasLogo: true });
    await expect(controller.attachLogo('req-1', file)).resolves.toEqual({ id: 'req-1', hasLogo: true });
    expect(service.attachLogo).toHaveBeenCalledWith('req-1', file);
  });

  it('delega attachDocument al servicio', async () => {
    const file = { originalname: 'doc.pdf', buffer: Buffer.from('') } as any;
    service.attachDocument.mockResolvedValue({ id: 'req-1', hasDocument: true });
    await expect(controller.attachDocument('req-1', file)).resolves.toEqual({ id: 'req-1', hasDocument: true });
    expect(service.attachDocument).toHaveBeenCalledWith('req-1', file);
  });

  it('delega submit al servicio', async () => {
    service.submit.mockResolvedValue({ id: 'req-1', requestCode: 'EMP-2026-0001' });
    await expect(controller.submit('req-1')).resolves.toEqual({ id: 'req-1', requestCode: 'EMP-2026-0001' });
    expect(service.submit).toHaveBeenCalledWith('req-1');
  });

  it('delega getStatus al servicio', async () => {
    service.getStatus.mockResolvedValue({ code: 'EMP-2026-0001', status: 'PENDING' });
    await expect(controller.getStatus('EMP-2026-0001', 'test@test.com')).resolves.toEqual({
      code: 'EMP-2026-0001',
      status: 'PENDING',
    });
    expect(service.getStatus).toHaveBeenCalledWith('EMP-2026-0001', 'test@test.com');
  });

  it('delega getActivationStatus al servicio', async () => {
    service.getActivationStatus.mockResolvedValue({ email: 'test@test.com', status: 'PENDING' });
    await expect(controller.getActivationStatus('test@test.com', 'EMP-2026-0001', '123456')).resolves.toEqual({
      email: 'test@test.com',
      status: 'PENDING',
    });
    expect(service.getActivationStatus).toHaveBeenCalledWith('test@test.com', 'EMP-2026-0001', '123456');
  });

  it('delega reportInconsistency al servicio', async () => {
    const body = { requestCode: 'EMP-2026-0001', email: 'test@test.com', observation: 'Obs' } as any;
    service.reportInconsistency.mockResolvedValue({ success: true });
    await expect(controller.reportInconsistency(body)).resolves.toEqual({ success: true });
    expect(service.reportInconsistency).toHaveBeenCalledWith(body);
  });

  it('delega activate al servicio', async () => {
    const body = { requestCode: 'EMP-2026-0001', email: 'test@test.com', code: '123456', password: 'pass' } as any;
    service.activate.mockResolvedValue({ success: true });
    await expect(controller.activate(body)).resolves.toEqual({ success: true });
    expect(service.activate).toHaveBeenCalledWith(body);
  });

  it('delega getPublicLogo y escribe en respuesta binaria', async () => {
    const buffer = Buffer.from('image-data');
    service.getPublicCompanyLogo.mockResolvedValue({ mimeType: 'image/png', content: buffer });
    const res = { set: vi.fn(), end: vi.fn() };
    await controller.getPublicLogo('comp-1', res as any);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'image/png' }));
    expect(res.end).toHaveBeenCalledWith(buffer);
  });

  it('delega list al servicio', async () => {
    const query = { page: 1, limit: 10, status: 'ALL' } as any;
    service.list.mockResolvedValue({ items: [], total: 0 });
    await expect(controller.list(query)).resolves.toEqual({ items: [], total: 0 });
    expect(service.list).toHaveBeenCalledWith(query);
  });

  it('delega getSummary al servicio', async () => {
    service.getSummary.mockResolvedValue({ pending: 5, approved: 10 });
    await expect(controller.getSummary()).resolves.toEqual({ pending: 5, approved: 10 });
  });

  it('delega getDetail con user.id', async () => {
    service.getDetail.mockResolvedValue({ id: 'req-1' });
    await expect(controller.getDetail('req-1', mockUser)).resolves.toEqual({ id: 'req-1' });
    expect(service.getDetail).toHaveBeenCalledWith('req-1', 'user-admin-1');
  });

  it('delega getDocument y escribe en respuesta binaria', async () => {
    const buffer = Buffer.from('pdf-data');
    service.getDocument.mockResolvedValue({ name: 'carta.pdf', mimeType: 'application/pdf', content: buffer });
    const res = { set: vi.fn(), end: vi.fn() };
    await controller.getDocument('req-1', res as any);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/pdf' }));
    expect(res.end).toHaveBeenCalledWith(buffer);
  });

  it('delega getRequestLogo y escribe en respuesta binaria', async () => {
    const buffer = Buffer.from('logo-data');
    service.getLogo.mockResolvedValue({ mimeType: 'image/png', content: buffer });
    const res = { set: vi.fn(), end: vi.fn() };
    await controller.getRequestLogo('req-1', res as any);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'image/png' }));
    expect(res.end).toHaveBeenCalledWith(buffer);
  });

  it('delega update al servicio', async () => {
    const body = { companyName: 'Nuevo' } as any;
    service.update.mockResolvedValue({ id: 'req-1' });
    await expect(controller.update('req-1', body)).resolves.toEqual({ id: 'req-1' });
    expect(service.update).toHaveBeenCalledWith('req-1', body);
  });

  it('delega reEvaluateOcr al servicio', async () => {
    service.reEvaluateOcr.mockResolvedValue({ score: 100 });
    await expect(controller.reEvaluateOcr('req-1')).resolves.toEqual({ score: 100 });
    expect(service.reEvaluateOcr).toHaveBeenCalledWith('req-1');
  });

  it('delega requestCorrection al servicio', async () => {
    const body = { reasonCategory: 'Doc', customDetails: 'Detalle largo' } as any;
    service.requestCorrection.mockResolvedValue({ id: 'req-1', status: 'IN_REVIEW' });
    await expect(controller.requestCorrection('req-1', body, mockUser)).resolves.toEqual({ id: 'req-1', status: 'IN_REVIEW' });
    expect(service.requestCorrection).toHaveBeenCalledWith('req-1', 'user-admin-1', body);
  });

  it('delega approve al servicio', async () => {
    service.approve.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });
    await expect(controller.approve('req-1', mockUser)).resolves.toEqual({ id: 'req-1', status: 'APPROVED' });
    expect(service.approve).toHaveBeenCalledWith('req-1', 'user-admin-1');
  });

  it('delega reject al servicio', async () => {
    const body = { reason: 'Motivo' } as any;
    service.reject.mockResolvedValue({ id: 'req-1', status: 'REJECTED' });
    await expect(controller.reject('req-1', body, mockUser)).resolves.toEqual({ id: 'req-1', status: 'REJECTED' });
    expect(service.reject).toHaveBeenCalledWith('req-1', 'user-admin-1', body);
  });
});
