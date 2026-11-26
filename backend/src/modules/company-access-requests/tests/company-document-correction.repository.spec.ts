import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { CompanyDocumentCorrectionConflictException } from '../exceptions/company-document-correction-conflict.exception.js';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';
import { companyCorrectionContext } from './company-document-correction.fixture.js';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('test database error', {
    code,
    clientVersion: 'test',
  });
}

function build() {
  const companyAccessRequest = { findUnique: vi.fn(), update: vi.fn() };
  companyAccessRequest.update.mockResolvedValue({ id: 'request-1' });
  const tx = { companyAccessRequest } as unknown as Prisma.TransactionClient;
  const prisma = {
    companyAccessRequest,
    $transaction: vi.fn(async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) =>
      callback(tx),
    ),
  };
  const repository = new CompanyAccessRequestsRepository(prisma as never);
  const createFile = vi.fn(async () => ({ id: 'file-2' }));
  return { companyAccessRequest, tx, prisma, repository, createFile };
}

describe('CompanyAccessRequestsRepository.replaceDocumentAndReopen', () => {
  it('reserva la revisión, guarda el archivo y limpia el dictamen en una sola transacción', async () => {
    const { repository, companyAccessRequest, tx, createFile } = build();

    await expect(
      repository.replaceDocumentAndReopen({ context: companyCorrectionContext(), createFile }),
    ).resolves.toEqual({ requestCode: 'EMP-2026-0001', status: 'PENDING' });

    expect(createFile).toHaveBeenCalledWith(tx);
    const [reserve, replace] = companyAccessRequest.update.mock.calls;
    expect(reserve[0].where).toEqual({
      id: 'request-1',
      requestCode: 'EMP-2026-0001',
      status: { title: { in: ['OBSERVED', 'REJECTED'] } },
      AND: [{ documentFileId: 'file-1' }],
      reviewedAt: new Date('2026-11-20T15:00:00.000Z'),
    });
    expect(reserve[0].data).toEqual({ status: { connect: { title: 'PENDING' } } });
    expect(replace[0].data).toMatchObject({
      documentFile: { connect: { id: 'file-2' } },
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: { disconnect: true },
      openedAt: null,
      openedBy: { disconnect: true },
      ocrMatchScore: null,
    });
    expect(companyAccessRequest.update.mock.invocationCallOrder[0]).toBeLessThan(
      createFile.mock.invocationCallOrder[0],
    );
  });

  it('responde conflicto si la revisión ya no coincide (P2025)', async () => {
    const { repository, companyAccessRequest, createFile } = build();
    companyAccessRequest.update.mockReset().mockRejectedValueOnce(prismaError('P2025'));

    await expect(
      repository.replaceDocumentAndReopen({ context: companyCorrectionContext(), createFile }),
    ).rejects.toBeInstanceOf(CompanyDocumentCorrectionConflictException);
    expect(createFile).not.toHaveBeenCalled();
  });

  it('propaga cualquier otro error', async () => {
    const { repository, companyAccessRequest, createFile } = build();
    companyAccessRequest.update.mockReset().mockRejectedValueOnce(prismaError('P2002'));

    await expect(
      repository.replaceDocumentAndReopen({ context: companyCorrectionContext(), createFile }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('consulta la revisión por código con el select mínimo', async () => {
    const { repository, companyAccessRequest } = build();
    companyAccessRequest.findUnique.mockResolvedValue(null);

    await repository.findCorrectionSnapshotByCode('EMP-2026-0001');

    expect(companyAccessRequest.findUnique).toHaveBeenCalledWith({
      where: { requestCode: 'EMP-2026-0001' },
      select: {
        id: true,
        requestCode: true,
        documentFileId: true,
        reviewedAt: true,
        status: { select: { title: true } },
      },
    });
  });
});
