import { describe, expect, it, vi } from 'vitest';
import { DocumentVerificationService } from '../services/document-verification.service.js';
import { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

function setup() {
  const store = {
    history: vi.fn(),
    acknowledge: vi.fn(),
    reviews: vi.fn().mockResolvedValue([]),
    file: vi.fn().mockResolvedValue([]),
    decide: vi.fn(),
    revise: vi.fn(),
  };
  const users = { findDocumentOwners: vi.fn().mockResolvedValue([]) };
  type Args = ConstructorParameters<typeof DocumentVerificationService>;
  const service = new DocumentVerificationService(
    store as unknown as Args[0],
    {} as Args[1],
    {} as Args[2],
    {} as Args[3],
    {} as Args[4],
    {} as Args[5],
    {} as Args[6],
    users as unknown as Args[7],
    {} as Args[8],
  );
  return { store, users, service };
}
describe('document verification application service', () => {
  it.each([
    { decision: 'unsupported' },
    { decision: 'approved', extra: true },
    null,
  ])(
    'rejects invalid transitions before touching persistence: %j',
    async (input) => {
      const { service, store } = setup();
      await expect(
        service.decide('admin', 'version', input),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'DOCUMENT_VERIFICATION_INVALID',
      });
      expect(store.decide).not.toHaveBeenCalled();
      expect(store.revise).not.toHaveBeenCalled();
    },
  );
  it.each(['approved', 'rejected', 'reprocess', 'revoke'])(
    'coordinates %s and reports stale versions',
    async (decision) => {
      const { service, store } = setup();
      store.decide.mockResolvedValue(1);
      store.revise.mockResolvedValue(1);
      await expect(
        service.decide('admin', 'version', { decision }),
      ).resolves.toEqual({ id: 'version' });
      if (decision === 'approved' || decision === 'rejected')
        expect(store.decide).toHaveBeenCalledWith(
          'admin',
          'version',
          decision === 'approved',
        );
      else
        expect(store.revise).toHaveBeenCalledWith('admin', 'version', decision);
      store.decide.mockResolvedValue(0);
      store.revise.mockResolvedValue(0);
      await expect(
        service.decide('admin', 'version', { decision }),
      ).rejects.toMatchObject({ statusCode: 409 });
    },
  );
  it('scopes notification and file access to the authenticated owner', async () => {
    const { service, store } = setup();
    store.acknowledge.mockResolvedValue(1);
    await expect(
      service.acknowledge('owner', 'version', { status: 'approved' }),
    ).resolves.toEqual({ id: 'version' });
    expect(store.acknowledge).toHaveBeenCalledWith(
      'owner',
      'version',
      'approved',
    );
    await expect(
      service.acknowledge('owner', 'version', { status: 'invented' }),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.file('version', 'owner')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(store.file).toHaveBeenCalledWith('version', 'owner');
  });
  it('obtains owner names from Users after reading the document queue', async () => {
    const { service, store, users } = setup();
    store.reviews.mockResolvedValue([{ id: 'version', userId: 'owner' }]);
    users.findDocumentOwners.mockResolvedValue([
      { id: 'owner', firstName: 'Ana', lastName: 'Rojas' },
    ]);
    await expect(service.reviews({ filter: 'pending' })).resolves.toEqual([
      { id: 'version', ownerName: 'Ana Rojas' },
    ]);
    expect(users.findDocumentOwners).toHaveBeenCalledWith(['owner']);
    await expect(service.reviews({ filter: 'invalid' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
  it('retains atomic work acquisition without joining foreign domain tables', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const repository = new DocumentVerificationRepository({
      $queryRaw: query,
    } as unknown as PrismaService);
    await repository.claim();
    const sql = query.mock.calls[0][0].join('');
    expect(sql).toContain('FOR UPDATE SKIP LOCKED');
    expect(sql).toContain('lease=gen_random_uuid()');
    expect(sql).toContain('updated_at=clock_timestamp()');
    expect(sql).not.toContain('JOIN users');
    expect(sql).not.toContain('JOIN certifications');
  });
});
