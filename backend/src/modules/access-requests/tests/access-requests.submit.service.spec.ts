import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessRequestsService } from '../services/access-requests.service.js';
import {
  AccessRequestNotEditableException,
  AccessRequestNotFoundException,
  ActiveAccessRequestExistsException,
  DocumentRequiredToSubmitException,
  DuplicateAccessRequestDataException,
} from '../exceptions/index.js';

function draft(overrides: Record<string, unknown> = {}) {
  return {
    id: 'id-1',
    email: 'ana@umss.edu.bo',
    idCardNumber: '123',
    sisCode: '456',
    documentFileId: 'file-1',
    documentType: { title: 'national_title' },
    status: { title: 'draft' },
    ...overrides,
  };
}

describe('AccessRequestsService: envío y consulta de estado', () => {
  const repository = { findById: vi.fn(), findActiveDuplicates: vi.fn(), submitWithGeneratedCode: vi.fn(), findByRequestCode: vi.fn() };
  const authService = { existsByEmail: vi.fn() };
  const filesService = { delete: vi.fn() };
  const documentReading = { scheduleReading: vi.fn() };
  let service: AccessRequestsService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new AccessRequestsService(repository as any, authService as any, filesService as any, {} as any, {} as any, {} as any, {} as any, documentReading as any);
    repository.findById.mockResolvedValue(draft());
    authService.existsByEmail.mockResolvedValue(false);
    repository.findActiveDuplicates.mockResolvedValue([]);
    repository.submitWithGeneratedCode.mockResolvedValue({
      id: 'id-1',
      requestCode: 'SOL-2026-0001',
      submittedAt: new Date('2026-10-05T15:00:00Z'),
      status: { title: 'pending' },
    });
  });

  describe('submit', () => {
    it('envía el borrador y devuelve id, código, estado pending y fecha ISO', async () => {
      const result = await service.submit('id-1');

      expect(repository.submitWithGeneratedCode).toHaveBeenCalledWith('id-1', expect.any(Function));
      expect(result).toEqual({
        id: 'id-1',
        requestCode: 'SOL-2026-0001',
        status: 'pending',
        submittedAt: '2026-10-05T15:00:00.000Z',
      });
    });

    it('busca duplicados activos por correo, C.I. y SIS excluyendo la propia solicitud', async () => {
      await service.submit('id-1');

      expect(repository.findActiveDuplicates).toHaveBeenCalledWith({
        email: 'ana@umss.edu.bo',
        idCardNumber: '123',
        sisCode: '456',
        excludeId: 'id-1',
      });
    });

    it('lanza 404 si la solicitud no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.submit('id-1')).rejects.toBeInstanceOf(AccessRequestNotFoundException);
      expect(repository.submitWithGeneratedCode).not.toHaveBeenCalled();
    });

    it.each(['pending', 'in_review', 'approved', 'rejected'])('lanza 409 si el estado es %s', async (status) => {
      repository.findById.mockResolvedValue(draft({ status: { title: status } }));

      await expect(service.submit('id-1')).rejects.toBeInstanceOf(AccessRequestNotEditableException);
      expect(repository.submitWithGeneratedCode).not.toHaveBeenCalled();
    });

    it.each([
      ['sin archivo', { documentFileId: null }],
      ['sin tipo de documento', { documentType: null }],
      ['sin ninguno de los dos', { documentFileId: null, documentType: null }],
    ])('lanza 400 %s', async (_name, overrides) => {
      repository.findById.mockResolvedValue(draft(overrides));

      const error = await service.submit('id-1').catch((e) => e);

      expect(error).toBeInstanceOf(DocumentRequiredToSubmitException);
      expect(error.statusCode).toBe(400);
      expect(repository.submitWithGeneratedCode).not.toHaveBeenCalled();
    });

    it('lanza 409 con el mensaje de correo registrado si ya existe una cuenta con ese correo', async () => {
      authService.existsByEmail.mockResolvedValue(true);

      const error = await service.submit('id-1').catch((e) => e);

      expect(error).toBeInstanceOf(DuplicateAccessRequestDataException);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('El correo ya está registrado');
      expect(authService.existsByEmail).toHaveBeenCalledWith('ana@umss.edu.bo');
      expect(repository.findActiveDuplicates).not.toHaveBeenCalled();
      expect(repository.submitWithGeneratedCode).not.toHaveBeenCalled();
    });

    it.each([
      ['correo', { email: 'ana@umss.edu.bo', idCardNumber: '999', sisCode: '999' }],
      ['C.I.', { email: 'otro@umss.edu.bo', idCardNumber: '123', sisCode: '999' }],
      ['SIS', { email: 'otro@umss.edu.bo', idCardNumber: '999', sisCode: '456' }],
    ])('lanza 409 de solicitud activa si otra comparte el %s (pending, in_review o approved)', async (_name, other) => {
      repository.findActiveDuplicates.mockResolvedValue([other]);

      const error = await service.submit('id-1').catch((e) => e);

      expect(error).toBeInstanceOf(ActiveAccessRequestExistsException);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Ya tienes una solicitud activa');
      expect(repository.submitWithGeneratedCode).not.toHaveBeenCalled();
    });

    it('si el repository no devuelve coincidencias (borradores y rechazadas no cuentan) envía', async () => {
      repository.findActiveDuplicates.mockResolvedValue([]);

      await expect(service.submit('id-1')).resolves.toMatchObject({ status: 'pending' });
    });

    it('propaga el 404 del repository si la solicitud cambió de estado entre la lectura y el envío', async () => {
      repository.submitWithGeneratedCode.mockRejectedValue(new AccessRequestNotFoundException());

      await expect(service.submit('id-1')).rejects.toBeInstanceOf(AccessRequestNotFoundException);
    });

    it('devuelve submittedAt nulo si el repository no lo informa', async () => {
      repository.submitWithGeneratedCode.mockResolvedValue({ id: 'id-1', requestCode: 'SOL-2026-0001', submittedAt: null, status: { title: 'pending' } });

      await expect(service.submit('id-1')).resolves.toMatchObject({ submittedAt: null });
    });
  });

  describe('getStatus', () => {
    const found = {
      requestCode: 'SOL-2026-0001',
      firstName: 'Ana María',
      lastName: 'Pérez López',
      submittedAt: new Date('2026-10-05T15:00:00Z'),
      reviewedAt: null,
      rejectionReason: null,
      status: { title: 'pending' },
      documentType: { title: 'national_title' },
      documentFile: { size: 2048, mimeType: 'application/pdf' },
    };

    it('conserva el contrato de una solicitud pendiente sin devolver el nombre', async () => {
      repository.findByRequestCode.mockResolvedValue(found);

      const result = await service.getStatus('SOL-2026-0001', 'ana@umss.edu.bo');

      expect(result).toEqual({
        requestCode: 'SOL-2026-0001',
        status: 'pending',
        submittedAt: '2026-10-05T15:00:00.000Z',
        reviewedAt: null,
        rejectionReason: null,
        document: { type: 'national_title', size: 2048, mimeType: 'application/pdf' },
      });
    });

    it('incluye el nombre completo, motivo y fecha de una solicitud rechazada', async () => {
      repository.findByRequestCode.mockResolvedValue({
        ...found,
        status: { title: 'rejected' },
        reviewedAt: new Date('2026-10-06T10:00:00Z'),
        rejectionReason: 'Documento ilegible',
      });

      const result = await service.getStatus('SOL-2026-0001', 'ana@umss.edu.bo');

      expect(result).toEqual({
        requestCode: 'SOL-2026-0001',
        status: 'rejected',
        fullName: 'Ana María Pérez López',
        submittedAt: '2026-10-05T15:00:00.000Z',
        reviewedAt: '2026-10-06T10:00:00.000Z',
        rejectionReason: 'Documento ilegible',
        document: { type: 'national_title', size: 2048, mimeType: 'application/pdf' },
      });
    });

    it.each(['draft', 'pending', 'in_review', 'approved'])(
      'omite completamente el nombre cuando el estado es %s',
      async (status) => {
        repository.findByRequestCode.mockResolvedValue({
          ...found,
          status: { title: status },
        });

        const result = await service.getStatus('SOL-2026-0001', 'ana@umss.edu.bo');

        expect(result).not.toHaveProperty('fullName');
        expect(result).not.toHaveProperty('firstName');
        expect(result).not.toHaveProperty('lastName');
      },
    );

    it('no añade otros datos personales a una solicitud rechazada', async () => {
      repository.findByRequestCode.mockResolvedValue({
        ...found,
        status: { title: 'rejected' },
      });

      const result = await service.getStatus('SOL-2026-0001', 'ana@umss.edu.bo');

      for (const forbidden of [
        'firstName',
        'lastName',
        'idCardNumber',
        'sisCode',
        'phone',
        'email',
        'birthDate',
        'content',
      ]) {
        expect(result).not.toHaveProperty(forbidden);
      }

      expect(result.document).toEqual({
        type: 'national_title',
        size: 2048,
        mimeType: 'application/pdf',
      });
    });

    it.each([
      { documentFile: null },
      { documentType: null },
    ])('document es null si falta archivo o tipo: %j', async (overrides) => {
      repository.findByRequestCode.mockResolvedValue({
        ...found,
        ...overrides,
      });

      await expect(
        service.getStatus('SOL-2026-0001', 'ana@umss.edu.bo'),
      ).resolves.toMatchObject({ document: null });
    });

    it('normaliza el correo a minúsculas y elimina espacios externos', async () => {
      repository.findByRequestCode.mockResolvedValue(found);

      await service.getStatus('SOL-2026-0001', ' ANA@Umss.edu.bo ');

      expect(repository.findByRequestCode).toHaveBeenCalledWith(
        'SOL-2026-0001',
        'ana@umss.edu.bo',
      );
    });

    it('lanza el mismo error genérico si el código no existe o el correo no coincide', async () => {
      repository.findByRequestCode.mockResolvedValue(null);

      const missingCode = await service
        .getStatus('SOL-2026-9999', 'ana@umss.edu.bo')
        .catch((error) => error);

      const wrongEmail = await service
        .getStatus('SOL-2026-0001', 'otra@umss.edu.bo')
        .catch((error) => error);

      expect(missingCode).toBeInstanceOf(AccessRequestNotFoundException);
      expect(wrongEmail).toBeInstanceOf(AccessRequestNotFoundException);
      expect(missingCode.statusCode).toBe(404);
      expect(wrongEmail.statusCode).toBe(404);
      expect(missingCode.message).toBe('La solicitud de acceso no existe');
      expect(wrongEmail.message).toBe(missingCode.message);
    });
  });
});
