import { act, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderHookWithQuery } from '@/shared/testing/render-hook-with-query';
import { DOCUMENT_VERIFICATIONS_QUERY_KEY } from '../constants/document-verification-query.constants';
import { documentsService } from '../services/documents.service';
import { useCvMutations } from './use-cv-mutations';
import { useDeleteCvMutation } from './use-delete-cv-mutation';

vi.mock('../services/documents.service', () => ({
  documentsService: { uploadCv: vi.fn(), deleteCv: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it.each(['upload', 'replacement'])(
  'invalidates verification data immediately after %s',
  async () => {
    vi.mocked(documentsService.uploadCv).mockResolvedValue(null);
    const { result, client } = renderHookWithQuery(() => useCvMutations());
    const key = [...DOCUMENT_VERIFICATIONS_QUERY_KEY, 'user'];
    client.setQueryData(key, []);
    await act(async () => {
      await result.current.uploadMutation.mutateAsync(
        new File(['pdf'], 'CV.pdf'),
      );
    });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  },
);
it('invalidates verification data on successful deletion', async () => {
  vi.mocked(documentsService.deleteCv).mockResolvedValue();
  const { result, client } = renderHookWithQuery(() => useDeleteCvMutation());
  const key = [...DOCUMENT_VERIFICATIONS_QUERY_KEY, 'user'];
  client.setQueryData(key, []);
  await act(async () => {
    await result.current.mutateAsync('cv');
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
});
it('does not invalidate verification data when upload fails', async () => {
  vi.mocked(documentsService.uploadCv).mockRejectedValue(new Error('failed'));
  const { result, client } = renderHookWithQuery(() => useCvMutations());
  const key = [...DOCUMENT_VERIFICATIONS_QUERY_KEY, 'user'];
  client.setQueryData(key, []);
  await act(async () => {
    await expect(
      result.current.uploadMutation.mutateAsync(new File(['pdf'], 'CV.pdf')),
    ).rejects.toThrow('failed');
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(false);
});
