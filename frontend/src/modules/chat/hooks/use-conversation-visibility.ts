'use client';

import { useEffect } from 'react';
import { getChatSocket } from '../services/chat-socket';

export function useConversationVisibility(conversationId: string | null) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (
      window as unknown as { __activeConversationId?: string | null }
    ).__activeConversationId = conversationId;

    let socket: ReturnType<typeof getChatSocket> | undefined;
    try {
      socket = getChatSocket();
    } catch {
      return;
    }

    const notifyVisibility = () => {
      const isFocused =
        document.visibilityState === 'visible' &&
        (typeof document.hasFocus === 'function' ? document.hasFocus() : true);

      socket?.emit('visibility:changed', {
        conversationId,
        isFocused,
      });
    };

    notifyVisibility();

    if (typeof socket?.on === 'function') {
      socket.on('connect', notifyVisibility);
    }

    const handleFocus = () => notifyVisibility();
    const handleBlur = () => {
      socket?.emit('visibility:changed', {
        conversationId,
        isFocused: false,
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        socket?.emit('visibility:changed', {
          conversationId,
          isFocused: false,
        });
      } else {
        notifyVisibility();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      (
        window as unknown as { __activeConversationId?: string | null }
      ).__activeConversationId = null;
      if (typeof socket?.off === 'function') {
        socket.off('connect', notifyVisibility);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      try {
        socket?.emit('visibility:changed', {
          conversationId: null,
          isFocused: false,
        });
      } catch {
        // Socket may not be available or connected
      }
    };
  }, [conversationId]);
}
