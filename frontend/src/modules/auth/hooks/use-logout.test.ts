import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('calls deactivate before cleaning session', () => {
    const mockDeactivate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: mockDeactivate,
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);

    const { result } = renderHook(() => useLogout());

    result.current();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
    expect(sessionModule.endSession).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('continues logout and does not throw if deactivate fails', () => {
    const mockDeactivate = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.mocked(pushHookModule.usePushNotifications).mockReturnValue({
      deactivate: mockDeactivate,
    } as unknown as ReturnType<typeof pushHookModule.usePushNotifications>);

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLogout());

    expect(() => result.current()).not.toThrow();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
    expect(sessionModule.endSession).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');

    consoleWarnSpy.mockRestore();
  });
});