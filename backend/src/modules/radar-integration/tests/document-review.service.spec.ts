import { describe, it, expect, vi } from 'vitest';
import { DocumentReviewService } from '../services/document-review.service.js';
import type { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import type { UsersService } from '../../users/services/users.service.js';
import {
  documentDecisionSchema,
  documentAcknowledgementSchema,
  documentReviewFilterSchema,
} from '../requests/document-verification.request.js';

function setup() {
  const store = {
    history: vi.fn(),
    acknowledge: vi.fn(),
    reviews: vi.fn(),
    revise: vi.fn(),
    file: vi.fn(),
  };

  const users = { findNamesByIds: vi.fn() };

  return {
    store,
    users,
    service: new DocumentReviewService(
      store as unknown as DocumentVerificationRepository,
      users as unknown as UsersService,
    ),
  };
}

describe('Document review coordination', () => {
  it('does not acknowledge a result that changed after the owner viewed it', async () => {
    const { store, service } = setup();
    store.acknowledge.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    await expect(
      service.acknowledge('owner', 'version', 'approved'),
    ).rejects.toMatchObject({ code: 'DOCUMENT_VERIFICATION_CONFLICT' });
    await expect(
      service.acknowledge('owner', 'version', 'approved'),
    ).resolves.toEqual({ id: 'version' });
    expect(store.acknowledge).toHaveBeenCalledWith(
      'owner',
      'version',
      'approved',
    );
    store.history.mockResolvedValue([{ id: 'own-version' }]);
    await expect(service.history('owner')).resolves.toEqual([
      { id: 'own-version' },
    ]);
    expect(store.history).toHaveBeenCalledWith('owner');
  });

  it('rechaza decisiones, estados y filtros desconocidos', () => {
    expect(
      documentDecisionSchema.safeParse({ decision: 'approve-all' }).success,
    ).toBe(false);
    expect(
      documentDecisionSchema.safeParse({
        decision: 'approved',
        userId: 'other',
      }).success,
    ).toBe(false);
    expect(
      documentAcknowledgementSchema.safeParse({ status: 'unknown' }).success,
    ).toBe(false);

    expect(documentReviewFilterSchema.safeParse('unknown').success).toBe(false);
    expect(documentReviewFilterSchema.parse(undefined)).toBe('pending');
  });

  it('limita la descarga al propietario y no devuelve archivos retirados', async () => {
    const { store, service } = setup();
    store.file.mockResolvedValue([]);

    await expect(service.file('version', 'owner')).rejects.toMatchObject({
      code: 'DOCUMENT_VERIFICATION_FILE_NOT_FOUND',
    });

    expect(store.file).toHaveBeenCalledWith('version', 'owner');
  });

  it('obtiene nombres en lote mediante Usuarios', async () => {
    const { store, users, service } = setup();

    store.reviews.mockResolvedValue([
      { id: 'v1', userId: 'u' },
      { id: 'v2', userId: 'u' },
    ]);

    users.findNamesByIds.mockResolvedValue([
      { id: 'u', firstName: 'Ana', lastName: 'Rojas' },
    ]);

    expect(await service.reviews('pending')).toEqual([
      { id: 'v1', ownerName: 'Ana Rojas' },
      { id: 'v2', ownerName: 'Ana Rojas' },
    ]);

    expect(users.findNamesByIds).toHaveBeenCalledWith(['u']);
  });
});
