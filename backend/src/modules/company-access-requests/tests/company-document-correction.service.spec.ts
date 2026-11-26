import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyRegistrationConflictException } from '../exceptions/company-registration-conflict.exception.js';
import { CompanyDocumentCorrectionService } from '../services/company-document-correction.service.js';
import { companyCorrectionContext } from './company-document-correction.fixture.js';

const PDF = { originalname: 'carta.pdf', buffer: Buffer.from('%PDF-1.7') } as never;

describe('CompanyDocumentCorrectionService', () => {
  const repository = {
    findById: vi.fn(),
    findDuplicates: vi.fn(),
    replaceDocumentAndReopen: vi.fn(),
  };
  const filesService = { create: vi.fn(), delete: vi.fn() };
  const requestsService = { evaluateLetterheadOcr: vi.fn() };
  let service: CompanyDocumentCorrectionService;

  const request = {
    id: 'request-1',
    companyName: 'Tech Andina',
    email: 'contacto@techandina.com',
    username: 'techandina',
  };
  const noDuplicates = {
    existingCompany: null,
    existingUser: null,
    activeRequest: null,
    existingUsername: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository.findById.mockResolvedValue(request);
    repository.findDuplicates.mockResolvedValue(noDuplicates);
    repository.replaceDocumentAndReopen.mockResolvedValue({
      requestCode: 'EMP-2026-0001',
      status: 'PENDING',
    });
    filesService.delete.mockResolvedValue(undefined);
    requestsService.evaluateLetterheadOcr.mockResolvedValue(null);
    service = new CompanyDocumentCorrectionService(
      repository as never,
      filesService as never,
      requestsService as never,
    );
  });

  it('exige adjuntar el documento antes de consultar nada', async () => {
    await expect(service.resubmit(companyCorrectionContext(), undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('falla con 404 si la solicitud ya no existe', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.resubmit(companyCorrectionContext(), PDF)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reemplaza el documento, borra el anterior y vuelve a evaluar la carta', async () => {
    const result = await service.resubmit(companyCorrectionContext(), PDF);

    expect(result).toEqual({ requestCode: 'EMP-2026-0001', status: 'PENDING' });
    expect(repository.findDuplicates).toHaveBeenCalledWith(
      'Tech Andina',
      'contacto@techandina.com',
      'techandina',
      'request-1',
    );
    expect(filesService.delete).toHaveBeenCalledWith('file-1');
    expect(requestsService.evaluateLetterheadOcr).toHaveBeenCalledWith('request-1');
  });

  it('crea el archivo dentro de la transacción con el nombre decodificado', async () => {
    const tx = { marker: 'tx' };
    filesService.create.mockResolvedValue({ id: 'file-2' });
    repository.replaceDocumentAndReopen.mockImplementation(
      async (operation: { createFile: (client: unknown) => Promise<unknown> }) => {
        await operation.createFile(tx);
        return { requestCode: 'EMP-2026-0001', status: 'PENDING' };
      },
    );
    const file = {
      originalname: Buffer.from('Cárta.pdf', 'utf8').toString('latin1'),
      buffer: Buffer.from('%PDF-1.7'),
    } as never;

    await service.resubmit(companyCorrectionContext(), file);

    expect(filesService.create).toHaveBeenCalledWith(
      { name: 'Cárta.pdf', content: Buffer.from('%PDF-1.7') },
      tx,
    );
  });

  it('no intenta borrar un archivo previo inexistente', async () => {
    await service.resubmit(companyCorrectionContext({ previousFileId: null }), PDF);
    expect(filesService.delete).not.toHaveBeenCalled();
  });

  it('un fallo al borrar el archivo previo no revierte el reenvío', async () => {
    filesService.delete.mockRejectedValue(new Error('sin permiso'));
    await expect(service.resubmit(companyCorrectionContext(), PDF)).resolves.toEqual({
      requestCode: 'EMP-2026-0001',
      status: 'PENDING',
    });
  });

  it.each([
    ['existingCompany', { existingCompany: { id: 'c-1' } }, 'companyName'],
    ['existingUser', { existingUser: { id: 'u-1' } }, 'email'],
    ['activeRequest', { activeRequest: { companyName: 'Tech Andina', email: 'otro@x.com' } }, 'activeRequest'],
    ['existingUsername', { existingUsername: { source: 'user' } }, 'username'],
  ])('responde 409 con data.field cuando hay conflicto de %s y no toca el documento', async (_label, duplicates, field) => {
    repository.findDuplicates.mockResolvedValue({ ...noDuplicates, ...duplicates });

    const error = await service.resubmit(companyCorrectionContext(), PDF).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CompanyRegistrationConflictException);
    expect((error as CompanyRegistrationConflictException).statusCode).toBe(409);
    expect((error as CompanyRegistrationConflictException).data).toEqual({ field });
    expect(repository.replaceDocumentAndReopen).not.toHaveBeenCalled();
    expect(filesService.delete).not.toHaveBeenCalled();
  });

  it('no borra el archivo previo ni evalúa el OCR si la transacción falla', async () => {
    repository.replaceDocumentAndReopen.mockRejectedValue(new Error('conflicto'));
    await expect(service.resubmit(companyCorrectionContext(), PDF)).rejects.toThrow('conflicto');
    expect(filesService.delete).not.toHaveBeenCalled();
    expect(requestsService.evaluateLetterheadOcr).not.toHaveBeenCalled();
  });
});
