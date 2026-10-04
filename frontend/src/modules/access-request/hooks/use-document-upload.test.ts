import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteDocument, uploadDocument } from '../services/document-upload.service';
import { useDeleteDocument, useUploadDocument } from './use-document-upload';

vi.mock('../services/document-upload.service', () => ({
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

const file = new File(['contenido'], 'diploma.pdf', { type: 'application/pdf' });
const uploaded = { id: '1', name: 'diploma.pdf', size: 9, mimeType: 'application/pdf' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUploadDocument', () => {
  it('calls onSuccess and reports progress', async () => {
    vi.mocked(uploadDocument).mockImplementation(async (_file, onProgress) => {
      onProgress(50);
      return uploaded;
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useUploadDocument());

    await act(async () => {
      await result.current.mutate(file, { onSuccess });
    });

    expect(onSuccess).toHaveBeenCalledWith(uploaded);
    expect(result.current.progress).toBe(50);
    expect(result.current.isPending).toBe(false);
  });

  it('calls onError when the upload fails', async () => {
    vi.mocked(uploadDocument).mockRejectedValue(new Error('fallo'));
    const onError = vi.fn();
    const { result } = renderHook(() => useUploadDocument());

    await act(async () => {
      await result.current.mutate(file, { onError });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.isPending).toBe(false);
  });

  it('resets the progress', async () => {
    vi.mocked(uploadDocument).mockImplementation(async (_file, onProgress) => {
      onProgress(80);
      return uploaded;
    });
    const { result } = renderHook(() => useUploadDocument());

    await act(async () => {
      await result.current.mutate(file);
    });
    act(() => result.current.reset());

    expect(result.current.progress).toBe(0);
  });
});

describe('useDeleteDocument', () => {
  it('calls onSuccess when the document is removed', async () => {
    vi.mocked(deleteDocument).mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeleteDocument());

    await act(async () => {
      await result.current.mutate('1', { onSuccess });
    });

    expect(deleteDocument).toHaveBeenCalledWith('1');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls onError when the removal fails', async () => {
    vi.mocked(deleteDocument).mockRejectedValue(new Error('fallo'));
    const onError = vi.fn();
    const { result } = renderHook(() => useDeleteDocument());

    await act(async () => {
      await result.current.mutate('1', { onError });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.isPending).toBe(false);
  });
});
