import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLogout } from './use-logout';
import * as pushHookModule from '@/shared/hooks/use-push-notifications';
import * as sessionModule from '../utils/session';
import { authService } from '../services/auth.service';
import { clearManualLogout } from '@/shared/utils/manual-logout';

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

vi.mock('../services/auth.service', () => ({
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/shared/hooks/use-push-notifications', () => ({
  usePushNotifications: vi.fn(),
}));

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearManualLogout();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('desactiva push y revoca la sesión antes de limpiar el navegador', async () => {
    const mockDeactivate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: mockDeactivate,
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);

    const { result } = renderHook(() => useLogout());

    await result.current();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
    expect(mockDeactivate).toHaveBeenCalledBefore(vi.mocked(authService.logout));
    expect(authService.logout).toHaveBeenCalledBefore(vi.mocked(sessionModule.endSession));
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
    expect(authService.logout).not.toHaveBeenCalled();
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

  it('comparte el cierre entre dos botones y termina el cierre local si falla la red', async () => {
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);
    vi.mocked(authService.logout).mockRejectedValueOnce(new Error('Sin red'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const first = renderHook(useLogout);
    const second = renderHook(useLogout);
    await Promise.all([first.result.current(), second.result.current()]);

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(sessionModule.endSession).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledExactlyOnceWith('/login');
  });
});
