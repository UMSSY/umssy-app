import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { verificationApi } from './document-verification.service';
import type { DocumentVerification } from '../types/document-verification.types';

afterEach(() => vi.restoreAllMocks());

describe('Document verification transport', () => {
  it('keeps owner history separate from the filtered administrative queue', async () => {
    const rows = [{ id: 'version', status: 'review' }];
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ data: { data: rows } });
    await expect(verificationApi.list()).resolves.toEqual(rows);
    expect(get).toHaveBeenLastCalledWith(
      '/profile/me/document-verifications',
      undefined,
    );
    await expect(verificationApi.list(true, 'approved')).resolves.toEqual(rows);
    expect(get).toHaveBeenLastCalledWith('/radar-document-reviews', {
      params: { filter: 'approved' },
    });
  });

  it('encodes resource identifiers and preserves file bytes for owner and administrator previews', async () => {
    const file = new Blob(['document'], { type: 'application/pdf' });
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: file });
    await expect(verificationApi.file('version/one')).resolves.toBe(file);
    expect(get).toHaveBeenLastCalledWith(
      '/profile/me/document-verifications/version%2Fone/file',
      { responseType: 'blob' },
    );
    await verificationApi.file('version/one', true);
    expect(get).toHaveBeenLastCalledWith(
      '/radar-document-reviews/version%2Fone/file',
      { responseType: 'blob' },
    );
  });

  it('acknowledges the exact version and status that the owner saw', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: {} });
    await verificationApi.acknowledge({
      id: 'version/one',
      status: 'approved',
    } as DocumentVerification);
    expect(patch).toHaveBeenCalledWith(
      '/profile/me/document-verifications/version%2Fone/notification',
      { status: 'approved' },
    );
    await verificationApi.decide('version/one', 'revoke');
    expect(patch).toHaveBeenLastCalledWith(
      '/radar-document-reviews/version%2Fone',
      { decision: 'revoke' },
    );
  });

  it('propagates a stale-version conflict so the caller can refresh instead of reporting success', async () => {
    const conflict = new Error('409 conflict');
    vi.spyOn(apiClient, 'patch').mockRejectedValue(conflict);
    await expect(verificationApi.decide('version', 'approved')).rejects.toBe(
      conflict,
    );
  });
});
