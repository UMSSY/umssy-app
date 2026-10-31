import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RejectionMailRepository } from '../repositories/rejection-mail.repository.js';

describe('RejectionMailRepository', () => {
  it('consulta por ID exacto y solo obtiene destinatario, motivo y revisión', async () => {
    const row = { email: 'ana@example.com', rejectionReason: 'Documento ilegible', updatedAt: new Date() };
    const findUnique = vi.fn().mockResolvedValue(row);
    const repository = new RejectionMailRepository({ accessRequest: { findUnique } } as unknown as PrismaService);
    expect(await repository.findById('request-1')).toEqual(row);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'request-1' }, select: {
      email: true, rejectionReason: true, updatedAt: true,
    } });
  });

  it('conserva el resultado ausente sin buscar otra solicitud del destinatario', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = new RejectionMailRepository({ accessRequest: { findUnique } } as unknown as PrismaService);
    expect(await repository.findById('no-existe')).toBeNull();
    expect(findUnique).toHaveBeenCalledTimes(1);
  });
});
