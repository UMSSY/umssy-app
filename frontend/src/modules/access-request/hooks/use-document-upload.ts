'use client';

import { useCallback, useState } from 'react';

import { deleteDocument, uploadDocument } from '../services/document-upload.service';
import type { UploadedDocumentResponse } from '../types/document-upload.types';

interface MutateCallbacks<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

// TODO: migrar a useMutation de TanStack Query cuando el equipo lo instale
export function useUploadDocument() {
  const [progress, setProgress] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (file: File, callbacks?: MutateCallbacks<UploadedDocumentResponse>) => {
      setProgress(0);
      setIsPending(true);
      try {
        const document = await uploadDocument(file, setProgress);
        callbacks?.onSuccess?.(document);
      } catch (error) {
        callbacks?.onError?.(error);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setProgress(0);
    setIsPending(false);
  }, []);

  return { mutate, reset, isPending, progress };
}

// TODO: migrar a useMutation de TanStack Query cuando el equipo lo instale
export function useDeleteDocument() {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (documentId: string, callbacks?: MutateCallbacks<void>) => {
      setIsPending(true);
      try {
        await deleteDocument(documentId);
        callbacks?.onSuccess?.();
      } catch (error) {
        callbacks?.onError?.(error);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { mutate, isPending };
}