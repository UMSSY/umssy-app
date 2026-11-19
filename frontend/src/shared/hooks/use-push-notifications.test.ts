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
      data: { data: { publicKey: 'ZHVtbXkta2V5' } },
    } as unknown as { data: { data: { publicKey: string } } });

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

  it('returns permission-blocked when user blocks the permission', async () => {
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('denied');

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.environment).toBe('supported');

    await act(async () => {
      const res = await result.current.activate();
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('permission-blocked');
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

  it('returns permission-dismissed when the user closes the native prompt', async () => {
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('default');

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const res = await result.current.activate();
      expect(res).toEqual({ ok: false, reason: 'permission-dismissed' });
    });
  });

  it('sync re-registers an existing browser subscription without prompting (HU-17)', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() });
    mockPushManager.getSubscription.mockResolvedValue({
      endpoint: 'https://fcm.existing',
      toJSON: () => ({ keys: { p256dh: 'k1', auth: 'k2' } }),
    });
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValue({} as unknown as unknown);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      expect(await result.current.sync({ token: 'session-a', signal: new AbortController().signal })).toBe(true);
    });

    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
      '/push/subscriptions',
      expect.objectContaining({ endpoint: 'https://fcm.existing' }),
      expect.objectContaining({ headers: { Authorization: 'Bearer session-a' } }),
    );
    expect(result.current.isSubscribed).toBe(true);
  });

  it('sync does nothing when permission is not granted', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      expect(await result.current.sync({ token: 'session-a', signal: new AbortController().signal })).toBe(false);
    });

    expect(apiClientModule.apiClient.post).not.toHaveBeenCalled();
  });

  it('sync registers the browser subscription with the session that started it', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() });
    mockPushManager.getSubscription.mockResolvedValue({
      endpoint: 'https://fcm...',
      toJSON: () => ({ endpoint: 'https://fcm...', keys: { p256dh: 'k1', auth: 'k2' } }),
    });
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValue({} as unknown as unknown);
    const controller = new AbortController();

    const { result } = renderHook(() => usePushNotifications());

    let isRegistered = false;
    await act(async () => {
      isRegistered = await result.current.sync({ token: 'session-a', signal: controller.signal });
    });

    expect(isRegistered).toBe(true);
    expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
      '/push/subscriptions',
      expect.objectContaining({ endpoint: 'https://fcm...' }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer session-a' },
        signal: controller.signal,
      }),
    );
  });

  it('sync does not register the device when its session was cancelled', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() });
    mockPushManager.getSubscription.mockResolvedValue({
      endpoint: 'https://fcm...',
      toJSON: () => ({ endpoint: 'https://fcm...', keys: { p256dh: 'k1', auth: 'k2' } }),
    });
    const controller = new AbortController();
    controller.abort();

    const { result } = renderHook(() => usePushNotifications());

    let isRegistered = true;
    await act(async () => {
      isRegistered = await result.current.sync({ token: 'session-a', signal: controller.signal });
    });

    expect(isRegistered).toBe(false);
    expect(apiClientModule.apiClient.post).not.toHaveBeenCalled();
  });
});
