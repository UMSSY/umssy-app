import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  requestGuardedNavigation,
  useUnsavedChangesGuard,
} from './use-unsaved-changes-guard';

afterEach(cleanup);

describe('button navigation with unsaved changes', () => {
  it('runs navigation immediately when no guard is active', () => {
    renderHook(() => useUnsavedChangesGuard(false));
    const navigate = vi.fn();
    act(() => requestGuardedNavigation(navigate));
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('defers navigation until the caller confirms it', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));
    const navigate = vi.fn();
    act(() => requestGuardedNavigation(navigate));
    expect(navigate).not.toHaveBeenCalled();
    act(() => result.current.pendingAction?.());
    expect(navigate).toHaveBeenCalledOnce();
    act(() => result.current.clearPendingAction());
    expect(result.current.pendingAction).toBeNull();
  });
});
