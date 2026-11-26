import { renderHook, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { toast } from 'sonner';
import { getActiveConversationId } from '@/modules/chat';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { useNotificationToasts } from '../hooks/use-notification-toasts';
import { getNotificationsSocket } from '../services/notifications-socket';
import type { ChatMessageToastProps } from '../types/chat-message-toast-props.types';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/modules/chat', () => ({
  getActiveConversationId: vi.fn(() => null),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { custom: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock('@/shared/services/storage/access-token-storage', () => ({
  getAccessToken: vi.fn(),
  subscribeAccessToken: vi.fn(() => () => undefined),
}));

vi.mock('../services/notifications-socket', () => ({
  getNotificationsSocket: vi.fn(),
  resetNotificationsSocket: vi.fn(),
}));

function createSocket() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    emitEvent: (event: string, data: unknown) => {
      listeners[event]?.forEach((handler) => handler(data));
    },
  };
}

describe('useNotificationToasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('no suscribe al socket si no hay sesión activa', () => {
    vi.mocked(getAccessToken).mockReturnValue(null);

    renderHook(() => useNotificationToasts());

    expect(getNotificationsSocket).not.toHaveBeenCalled();
  });

  it("se suscribe a 'notification:new' y muestra el toast de chat con el diseño de UMSSY", () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    renderHook(() => useNotificationToasts());

    expect(socket.on).toHaveBeenCalledWith(
      'notification:new',
      expect.any(Function),
    );

    act(() => {
      socket.emitEvent('notification:new', {
        typeCode: 'CHAT_MESSAGE',
        title: 'Mensaje nuevo de: Juan Pérez',
        body: 'Hola, ¿cómo estás?',
        actionUrl: '/chat?conversationId=conv-123',
      });
    });

    expect(toast).not.toHaveBeenCalled();
    expect(toast.custom).toHaveBeenCalledTimes(1);
    expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), {
      duration: 7000,
    });

    const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
    const element = renderToast('toast-1') as ReactElement<ChatMessageToastProps>;
    expect(element.props).toMatchObject({
      title: 'Juan Pérez',
      preview: 'Hola, ¿cómo estás?',
      actionLabel: 'Ver mensaje',
      siteLabel: window.location.hostname,
    });

    element.props.onOpen?.();
    expect(toast.dismiss).toHaveBeenCalledWith('toast-1');
    expect(mockPush).toHaveBeenCalledWith('/chat?conversationId=conv-123');

    element.props.onClose();
    expect(toast.dismiss).toHaveBeenCalledTimes(2);
  });

  it('muestra el nombre del grupo como título en los mensajes grupales', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    renderHook(() => useNotificationToasts());

    act(() => {
      socket.emitEvent('notification:new', {
        typeCode: 'CHAT_GROUP_MESSAGE',
        title: 'Mensaje nuevo en: Taller de React',
        body: 'Ana: Ya subí el material',
        actionUrl: '/events/1/chat',
      });
    });

    const element = vi.mocked(toast.custom).mock.calls[0][0]('toast-2') as ReactElement<ChatMessageToastProps>;
    expect(element.props.title).toBe('Taller de React');
    expect(element.props.preview).toBe('Ana: Ya subí el material');
  });

  it('usa la etiqueta del catálogo según el tipo, no según el título', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    renderHook(() => useNotificationToasts());

    act(() => {
      socket.emitEvent('notification:new', {
        typeCode: 'CONNECTION_REQUEST_ACCEPTED',
        title: 'Tienes un mensaje',
        body: 'Ya pueden conversar',
        actionUrl: '/chat?conversationId=1',
      });
    });

    const options = vi.mocked(toast).mock.calls[0][1] as {
      action?: { label: string };
      icon?: unknown;
    };
    expect(options.action?.label).toBe('Ir a la sala de chat');
    expect(options.icon).toBeDefined();
  });

  it('usa la etiqueta por defecto si el evento no trae un tipo conocido', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    renderHook(() => useNotificationToasts());

    act(() => {
      socket.emitEvent('notification:new', {
        title: 'Aviso general',
        body: 'Detalle',
        actionUrl: '/dashboard',
      });
    });

    const options = vi.mocked(toast).mock.calls[0][1] as {
      action?: { label: string };
    };
    expect(options.action?.label).toBe('Ver detalle');
  });

  it('desuscribe el evento al desmontar el hook', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );

    const { unmount } = renderHook(() => useNotificationToasts());

    unmount();

    expect(socket.off).toHaveBeenCalledWith(
      'notification:new',
      expect.any(Function),
    );
  });

  it('no muestra el toast de la conversación que el usuario tiene abierta', () => {
    const socket = createSocket();
    vi.mocked(getAccessToken).mockReturnValue('fake-token');
    vi.mocked(getNotificationsSocket).mockReturnValue(
      socket as unknown as Socket,
    );
    vi.mocked(getActiveConversationId).mockReturnValue('conv-123');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    renderHook(() => useNotificationToasts());

    act(() => {
      socket.emitEvent('notification:new', {
        typeCode: 'CHAT_MESSAGE',
        title: 'Mensaje nuevo de: Juan Pérez',
        body: 'Hola',
        actionUrl: '/chat?conversationId=conv-123',
      });
    });

    expect(toast).not.toHaveBeenCalled();
    expect(toast.custom).not.toHaveBeenCalled();
  });
});