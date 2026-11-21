'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseProfileGuideEditorOptions } from '../types/use-profile-guide-editor-options.types';

export function useProfileGuideEditor<T extends { id: string }>({
  isBusy: externalBusy = false,
  initiallyOpen = true,
  onDirtyChange,
  onBusyChange,
}: UseProfileGuideEditorOptions) {
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(initiallyOpen);
  const [hasChanges, setHasChanges] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [isFormBusy, setIsFormBusy] = useState(false);
  const writingRef = useRef(false);
  const isBusy = externalBusy || isWriting || isFormBusy;

  useEffect(() => {
    onBusyChange(isBusy);
    return () => onBusyChange(false);
  }, [isBusy, onBusyChange]);

  const setDirty = useCallback((dirty: boolean) => {
    setHasChanges(dirty);
    onDirtyChange(dirty);
  }, [onDirtyChange]);

  function resetForm() {
    setEditingItem(null);
    setIsFormOpen(false);
    setIsFormBusy(false);
    setDirty(false);
    setFormVersion(version => version + 1);
  }

  function openForm(item: T | null) {
    if (isBusy || hasChanges || writingRef.current) return false;
    setPendingDelete(null);
    setEditingItem(item);
    setFormVersion(version => version + 1);
    setIsFormOpen(true);
    return true;
  }

  function cancelForm() {
    if (isBusy || writingRef.current) return false;
    resetForm();
    return true;
  }

  function requestDelete(item: T) {
    if (isBusy || hasChanges || writingRef.current) return false;
    setPendingDelete(item);
    return true;
  }

  function cancelDelete() {
    if (isBusy || writingRef.current) return;
    setPendingDelete(null);
  }

  function completeDelete() {
    if (editingItem?.id === pendingDelete?.id) resetForm();
    setPendingDelete(null);
  }

  async function runWrite<TResult>(operation: () => Promise<TResult>): Promise<TResult | undefined> {
    if (isBusy || writingRef.current) return undefined;
    writingRef.current = true;
    setIsWriting(true);
    try {
      return await operation();
    } finally {
      writingRef.current = false;
      setIsWriting(false);
    }
  }

  return {
    editingItem,
    pendingDelete,
    isFormOpen,
    hasChanges,
    formVersion,
    isBusy,
    setDirty,
    setIsFormBusy,
    resetForm,
    openForm,
    cancelForm,
    requestDelete,
    cancelDelete,
    completeDelete,
    runWrite,
  };
}
