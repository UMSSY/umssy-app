import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useProfileGuideEditor } from './use-profile-guide-editor';

const RECORD = { id: 'record-1' };

function setup(initiallyOpen = true) {
  const callbacks = { onDirtyChange: vi.fn(), onBusyChange: vi.fn() };
  const hook = renderHook(({ isBusy }) => useProfileGuideEditor<typeof RECORD>({
    isBusy,
    initiallyOpen,
    ...callbacks,
  }), { initialProps: { isBusy: false } });
  return { ...hook, ...callbacks };
}

describe('useProfileGuideEditor', () => {
  it('preserves a dirty draft when another record or deletion is requested and resets it on cancellation', () => {
    const { result, onDirtyChange } = setup();
    act(() => result.current.openForm(RECORD));
    act(() => result.current.setDirty(true));
    act(() => {
      expect(result.current.openForm({ id: 'other' })).toBe(false);
      expect(result.current.requestDelete(RECORD)).toBe(false);
    });
    expect(result.current.editingItem).toEqual(RECORD);
    expect(result.current.pendingDelete).toBeNull();
    const previousVersion = result.current.formVersion;
    act(() => result.current.cancelForm());
    expect(result.current.isFormOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.formVersion).toBeGreaterThan(previousVersion);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('rejects overlapping writes immediately, blocks navigation and releases the lock after failure', async () => {
    const { result, onBusyChange } = setup();
    let reject!: (reason: Error) => void;
    const first = vi.fn(() => new Promise<void>((_resolve, rejectPromise) => { reject = rejectPromise; }));
    const duplicate = vi.fn();
    let pending!: Promise<void | undefined>;
    act(() => {
      pending = result.current.runWrite(first);
      void result.current.runWrite(duplicate);
      expect(result.current.openForm(RECORD)).toBe(false);
    });
    expect(duplicate).not.toHaveBeenCalled();
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    await act(async () => {
      reject(new Error('unavailable'));
      await expect(pending).rejects.toThrow('unavailable');
    });
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
    await act(async () => { await result.current.runWrite(duplicate); });
    expect(duplicate).toHaveBeenCalledOnce();
  });

  it('reports external and form busy states and clears the guide notification on unmount', () => {
    const { result, rerender, unmount, onBusyChange } = setup(false);
    expect(result.current.isFormOpen).toBe(false);
    rerender({ isBusy: true });
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    act(() => expect(result.current.openForm(RECORD)).toBe(false));
    rerender({ isBusy: false });
    act(() => result.current.setIsFormBusy(true));
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    unmount();
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it('resets the current editor only after its record has been removed', () => {
    const { result } = setup();
    act(() => result.current.openForm(RECORD));
    act(() => result.current.requestDelete({ id: 'other' }));
    act(() => result.current.completeDelete());
    expect(result.current.editingItem).toEqual(RECORD);
    act(() => result.current.requestDelete(RECORD));
    act(() => result.current.completeDelete());
    expect(result.current.editingItem).toBeNull();
    expect(result.current.isFormOpen).toBe(false);
    expect(result.current.pendingDelete).toBeNull();
  });
});
