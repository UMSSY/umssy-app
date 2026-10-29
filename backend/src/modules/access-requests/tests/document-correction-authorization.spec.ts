import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentCorrectionUnauthorizedException } from '../exceptions/document-correction-unauthorized.exception.js';
import { DocumentCorrectionRepository } from '../repositories/document-correction.repository.js';
import { DocumentCorrectionAuthorizationService } from '../services/document-correction-authorization.service.js';
import { CORRECTION_TEST_CODE, CORRECTION_TEST_SECRET, correctionContext, correctionSnapshot } from './document-correction.fixture.js';

describe('DocumentCorrectionAuthorizationService', () => {
  const repository = { findById: vi.fn(), findByCode: vi.fn() };
  const config = { get: vi.fn() };
  let service: DocumentCorrectionAuthorizationService;

  beforeEach(() => {
    vi.resetAllMocks();
    config.get.mockReturnValue(CORRECTION_TEST_SECRET);
    repository.findById.mockResolvedValue(correctionSnapshot());
    repository.findByCode.mockResolvedValue(correctionSnapshot());
    service = new DocumentCorrectionAuthorizationService(
      repository as unknown as DocumentCorrectionRepository, config as unknown as ConfigService,
    );
  });
  afterEach(() => vi.useRealTimers());

  it('emite internamente el permiso y verifica la autorización de la misma solicitud', async () => {
    const grant = await service.issueFor('request-1');
    expect(grant.requestCode).toBe(CORRECTION_TEST_CODE);
    expect(repository.findById).toHaveBeenCalledWith('request-1');
    await expect(service.authorize(grant.requestCode, `Bearer ${grant.token}`)).resolves.toEqual(correctionContext());
    expect(repository.findByCode).toHaveBeenCalledWith(CORRECTION_TEST_CODE);
  });

  it('solo conocer código y correo no permite obtener autorización', async () => {
    await expect(service.authorize(CORRECTION_TEST_CODE, 'ana@example.com')).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
    expect(repository.findByCode).not.toHaveBeenCalled();
  });

  it.each(['draft', 'pending', 'in_review', 'approved'])(
    'no emite ni acepta permisos cuando la solicitud está en %s', async (status) => {
      const grant = await service.issueFor('request-1');
      repository.findById.mockResolvedValue(correctionSnapshot({ status: { title: status } }));
      repository.findByCode.mockResolvedValue(correctionSnapshot({ status: { title: status } }));
      await expect(service.issueFor('request-1')).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
      await expect(service.authorize(CORRECTION_TEST_CODE, `Bearer ${grant.token}`)).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
    },
  );

  it('la solicitud inexistente utiliza el mismo error genérico', async () => {
    const grant = await service.issueFor('request-1');
    repository.findByCode.mockResolvedValue(null);
    const error = await service.authorize(CORRECTION_TEST_CODE, `Bearer ${grant.token}`).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(DocumentCorrectionUnauthorizedException);
    expect(error).toMatchObject({ statusCode: 401, code: 'DOCUMENT_CORRECTION_UNAUTHORIZED' });
    expect(String(error)).not.toMatch(/Ana|Pérez|example.com|file-old/);
    repository.findById.mockResolvedValue(null);
    await expect(service.issueFor('request-1')).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
  });

  it.each([undefined, null, [], '', 'Basic abc', 'Bearer session-token'].map((authorization) => ({ authorization })))(
    'rechaza cabeceras ausentes o ajenas al permiso: $authorization', async ({ authorization }) => {
      await expect(service.authorize(CORRECTION_TEST_CODE, authorization)).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
    },
  );

  it.each([undefined, '', 'otro', ['SOL-2026-0139']].map((code) => ({ code })))(
    'no consulta por identificaciones inválidas: $code', async ({ code }) => {
      await expect(service.authorize(code, 'Bearer token')).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
      expect(repository.findByCode).not.toHaveBeenCalled();
    },
  );

  it('no acepta el permiso de otra solicitud aunque el repositorio devuelva una fila', async () => {
    const grant = await service.issueFor('request-1');
    await expect(service.authorize('SOL-2026-9999', `Bearer ${grant.token}`)).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
  });

  it('el mismo permiso sigue disponible en otra fecha mientras no cambie la revisión', async () => {
    const grant = await service.issueFor('request-1');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2040-01-01T00:00:00.000Z'));
    await expect(service.authorize(CORRECTION_TEST_CODE, `Bearer ${grant.token}`)).resolves.toEqual(correctionContext());
  });

  it('cambiar la revisión invalida el permiso aunque el estado vuelva a rejected', async () => {
    const grant = await service.issueFor('request-1');
    repository.findByCode.mockResolvedValue(correctionSnapshot({ updatedAt: new Date('2026-11-01T00:00:00.000Z') }));
    await expect(service.authorize(CORRECTION_TEST_CODE, `Bearer ${grant.token}`)).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
  });

  it.each([undefined, '', '   '])('no autoriza si falta la clave del servidor: %j', async (secret) => {
    const grant = await service.issueFor('request-1');
    config.get.mockReturnValue(secret);
    await expect(service.authorize(CORRECTION_TEST_CODE, `Bearer ${grant.token}`)).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
    await expect(service.issueFor('request-1')).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
  });

  it.each([{ requestCode: null }, { updatedAt: new Date('invalid') }])('rechaza una revisión incompleta: %j', async (overrides) => {
    repository.findById.mockResolvedValue(correctionSnapshot(overrides));
    await expect(service.issueFor('request-1')).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
  });

  it('propaga fallos de persistencia sin inventar una autorización', async () => {
    const failure = new Error('db failure');
    const grant = await service.issueFor('request-1');
    repository.findByCode.mockRejectedValue(failure);
    await expect(service.authorize(CORRECTION_TEST_CODE, `Bearer ${grant.token}`)).rejects.toBe(failure);
  });
});
