import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLogout } from './use-logout';
import * as pushHookModule from '@/shared/hooks/use-push-notifications';
import * as sessionModule from '../utils/session';

const mockReplace = vi.fn();
const mockClear = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    clear: mockClear,
  }),
}));

vi.mock('../utils/session', () => ({
  endSession: vi.fn(),
}));

vi.mock('@/shared/hooks/use-push-notifications', () => ({
  usePushNotifications: vi.fn(),
}));

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls deactivate before cleaning session', async () => {
    const mockDeactivate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: mockDeactivate,
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);

    const { result } = renderHook(() => useLogout());

    await result.current();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
    expect(sessionModule.endSession).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('continues logout and does not throw if deactivate fails', async () => {
    const mockDeactivate = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: mockDeactivate,
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLogout());

    await expect(result.current()).resolves.toBeUndefined();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
    expect(sessionModule.endSession).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');

    consoleWarnSpy.mockRestore();
  });

  it('waits for deactivate before ending the session', async () => {
    let resolveDeactivate: () => void = () => {};
    const mockDeactivate = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveDeactivate = resolve;
      }),
    );
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: mockDeactivate,
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);

    const { result } = renderHook(() => useLogout());

    const logoutPromise = result.current();
    await Promise.resolve();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
    expect(sessionModule.endSession).not.toHaveBeenCalled();

    resolveDeactivate();
    await logoutPromise;

    expect(sessionModule.endSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('ends the session after the timeout if deactivate does not respond', async () => {
    vi.useFakeTimers();
    const mockDeactivate = vi.fn().mockReturnValue(new Promise<void>(() => {}));
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: mockDeactivate,
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);

    const { result } = renderHook(() => useLogout());

    const logoutPromise = result.current();
    await vi.advanceTimersByTimeAsync(2000);
    await logoutPromise;

    expect(sessionModule.endSession).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});