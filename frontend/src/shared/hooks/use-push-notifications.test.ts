import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePushNotifications } from './use-push-notifications';
import * as apiClientModule from '@/shared/services/api-client';
import { subscribeToPush } from '@/shared/utils/subscribe-to-push';

vi.mock('@/shared/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/shared/utils/subscribe-to-push', () => ({
  subscribeToPush: vi.fn(),
}));

describe('usePushNotifications', () => {
  let mockPushManager: {
    getSubscription: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockRegistration: { pushManager: typeof mockPushManager };
  let mockServiceWorker: { ready: Promise<typeof mockRegistration> };

  beforeEach(() => {
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn(),
    });

    vi.stubGlobal('PushManager', class {});

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn(),
    };

    mockRegistration = {
      pushManager: mockPushManager,
    };

    mockServiceWorker = {
      ready: Promise.resolve(mockRegistration),
    };

    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: mockServiceWorker,
      configurable: true,
    });

    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13)',
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('detects desktop environment and does not request permission', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.environment).toBe('desktop');

    await act(async () => {
      const res = await result.current.activate();
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('desktop');
    });

    expect(Notification.requestPermission).not.toHaveBeenCalled();
  });

  it('activates successfully when permission is granted', async () => {
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('granted');

    vi.mocked(subscribeToPush).mockResolvedValue({
      endpoint: 'https://fcm...',
      toJSON: () => ({
        endpoint: 'https://fcm...',
        keys: { p256dh: 'k1', auth: 'k2' },
      }),
      unsubscribe: vi.fn(),
    } as unknown as PushSubscription);

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({
      data: { publicKey: 'ZHVtbXkta2V5' },
    } as unknown as { data: { publicKey: string } });

    vi.mocked(apiClientModule.apiClient.post).mockResolvedValue({} as unknown as unknown);

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.environment).toBe('supported');

    await act(async () => {
      const res = await result.current.activate();
      expect(res.ok).toBe(true);
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
      '/push/subscriptions',
      expect.objectContaining({
        endpoint: 'https://fcm...',
        keys: { p256dh: 'k1', auth: 'k2' },
      }),
    );
  });

  it('returns permission-denied when user denies permission', async () => {
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('denied');

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.environment).toBe('supported');

    await act(async () => {
      const res = await result.current.activate();
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('permission-denied');
    });

    expect(result.current.isSubscribed).toBe(false);
  });

  it('deactivate removes subscription from backend and browser', async () => {
    const mockSubscription = {
      endpoint: 'https://fcm...',
      unsubscribe: vi.fn().mockResolvedValue(true),
    };
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription);
    vi.mocked(apiClientModule.apiClient.delete).mockResolvedValue({} as unknown as unknown);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.deactivate();
    });

    expect(apiClientModule.apiClient.delete).toHaveBeenCalledWith(
      '/push/subscriptions',
      { data: { endpoint: 'https://fcm...' } },
    );
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });
});