import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyDocumentCorrectionUnauthorizedException } from '../exceptions/company-document-correction-unauthorized.exception.js';
import { CompanyDocumentCorrectionAuthorizationService } from '../services/company-document-correction-authorization.service.js';
import {
  companyCorrectionSnapshot,
  CORRECTION_SECRET,
} from './company-document-correction.fixture.js';

describe('CompanyDocumentCorrectionAuthorizationService', () => {
  const repository = { findCorrectionSnapshotByCode: vi.fn() };
  const config = { get: vi.fn() };
  let service: CompanyDocumentCorrectionAuthorizationService;

  beforeEach(() => {
    vi.clearAllMocks();
    config.get.mockReturnValue(CORRECTION_SECRET);
    service = new CompanyDocumentCorrectionAuthorizationService(
      repository as never,
      config as never,
    );
  });

  const bearer = (snapshot = companyCorrectionSnapshot()) =>
    `Bearer ${service.issueFor(snapshot)}`;

  it.each(['OBSERVED', 'REJECTED'])('emite y autoriza un permiso para una solicitud %s', async (title) => {
    const snapshot = companyCorrectionSnapshot({ status: { title } });
    repository.findCorrectionSnapshotByCode.mockResolvedValue(snapshot);

    await expect(service.authorize('emp-2026-0001', bearer(snapshot))).resolves.toEqual({
      requestId: 'request-1',
      requestCode: 'EMP-2026-0001',
      previousFileId: 'file-1',
      revision: snapshot.reviewedAt,
    });
    expect(repository.findCorrectionSnapshotByCode).toHaveBeenCalledWith('EMP-2026-0001');
  });

  it.each(['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED'])('no emite permiso para una solicitud %s', (title) => {
    expect(() => service.issueFor(companyCorrectionSnapshot({ status: { title } }))).toThrow(
      CompanyDocumentCorrectionUnauthorizedException,
    );
  });

  it('no emite permiso sin código ni fecha de revisión', () => {
    expect(() => service.issueFor(companyCorrectionSnapshot({ requestCode: null }))).toThrow(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    expect(() => service.issueFor(companyCorrectionSnapshot({ reviewedAt: null }))).toThrow(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    expect(() => service.issueFor(companyCorrectionSnapshot({ reviewedAt: new Date('x') }))).toThrow(
      CompanyDocumentCorrectionUnauthorizedException,
    );
  });

  it('rechaza códigos con formato de titulados o inválidos sin consultar la base', async () => {
    await expect(service.authorize('SOL-2026-0001', bearer())).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    await expect(service.authorize(undefined, bearer())).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    expect(repository.findCorrectionSnapshotByCode).not.toHaveBeenCalled();
  });

  it('rechaza cabeceras ausentes, sin Bearer o con permiso malformado sin consultar la base', async () => {
    for (const header of [undefined, 42, 'Basic abc', 'Bearer ', 'Bearer ccr1.corto', `Bearer dcr1.${'A'.repeat(43)}`]) {
      await expect(service.authorize('EMP-2026-0001', header)).rejects.toBeInstanceOf(
        CompanyDocumentCorrectionUnauthorizedException,
      );
    }
    expect(repository.findCorrectionSnapshotByCode).not.toHaveBeenCalled();
  });

  it('rechaza cuando la solicitud no existe o ya no está observada ni rechazada', async () => {
    const header = bearer();
    repository.findCorrectionSnapshotByCode.mockResolvedValue(null);
    await expect(service.authorize('EMP-2026-0001', header)).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    repository.findCorrectionSnapshotByCode.mockResolvedValue(
      companyCorrectionSnapshot({ status: { title: 'PENDING' } }),
    );
    await expect(service.authorize('EMP-2026-0001', header)).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
  });

  it('invalida el permiso cuando cambia el archivo o la revisión', async () => {
    const header = bearer();
    repository.findCorrectionSnapshotByCode.mockResolvedValue(
      companyCorrectionSnapshot({ documentFileId: 'file-2' }),
    );
    await expect(service.authorize('EMP-2026-0001', header)).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    repository.findCorrectionSnapshotByCode.mockResolvedValue(
      companyCorrectionSnapshot({ reviewedAt: new Date('2026-11-22T10:00:00.000Z') }),
    );
    await expect(service.authorize('EMP-2026-0001', header)).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
  });

  it('rechaza el permiso de otra solicitud con el mismo estado', async () => {
    const header = bearer(companyCorrectionSnapshot({ id: 'request-2', requestCode: 'EMP-2026-0002' }));
    repository.findCorrectionSnapshotByCode.mockResolvedValue(companyCorrectionSnapshot());
    await expect(service.authorize('EMP-2026-0001', header)).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
  });

  it('no autoriza si falta el secreto', async () => {
    const header = bearer();
    config.get.mockReturnValue('  ');
    repository.findCorrectionSnapshotByCode.mockResolvedValue(companyCorrectionSnapshot());
    await expect(service.authorize('EMP-2026-0001', header)).rejects.toBeInstanceOf(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    expect(() => service.issueFor(companyCorrectionSnapshot())).toThrow(
      CompanyDocumentCorrectionUnauthorizedException,
    );
  });
});
