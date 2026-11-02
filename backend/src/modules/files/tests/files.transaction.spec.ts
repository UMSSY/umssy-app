import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { FilesRepository } from '../repositories/files.repository.js';
import { FilesService } from '../services/files.service.js';
import { EmptyFileException, FileTooLargeException, InvalidFileTypeException } from '../exceptions/index.js';
import { MAX_FILE_SIZE_BYTES } from '../constants/file-rules.constants.js';

describe('Almacenamiento documental dentro de una transacción', () => {
  it('FilesRepository usa el cliente recibido y no una escritura independiente', async () => {
    const globalFile = { create: vi.fn() };
    const transactionalFile = { create: vi.fn().mockResolvedValue({ id: 'new-file' }) };
    const repository = new FilesRepository({ file: globalFile } as unknown as PrismaService);
    const tx = { file: transactionalFile } as unknown as Prisma.TransactionClient;
    await repository.create({ name: 'titulo', extension: 'pdf', mimeType: 'application/pdf', size: 4, content: Buffer.from('%PDF') }, tx);
    expect(globalFile.create).not.toHaveBeenCalled();
    expect(transactionalFile.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ content: new Uint8Array(Buffer.from('%PDF')) }) }));
  });

  it('FilesService conserva las validaciones y propaga la transacción', async () => {
    const repository = { create: vi.fn().mockResolvedValue({ id: 'new-file' }) };
    const service = new FilesService(repository as unknown as FilesRepository);
    const tx = {} as Prisma.TransactionClient;
    await service.create({ name: 'titulo.pdf', content: Buffer.from('%PDF-1') }, tx);
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'titulo', mimeType: 'application/pdf' }), tx);
  });

  it.each([
    { content: Buffer.alloc(0), exception: EmptyFileException },
    { content: Buffer.alloc(MAX_FILE_SIZE_BYTES + 1), exception: FileTooLargeException },
    { content: Buffer.from('MZ executable'), exception: InvalidFileTypeException },
  ])('rechaza datos inválidos sin insertar archivos en la transacción: $exception.name', async ({ content, exception }) => {
    const repository = { create: vi.fn() };
    const service = new FilesService(repository as unknown as FilesRepository);
    await expect(service.create({ name: 'titulo.pdf', content }, {} as Prisma.TransactionClient)).rejects.toBeInstanceOf(exception);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
