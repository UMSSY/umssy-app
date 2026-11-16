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
      const isVisible = document.visibilityState === 'visible';
      const isOpen = Boolean(conversationId) && isVisible;

      socket?.emit('visibility:changed', {
        conversationId,
        isFocused: isVisible,
        isOpen,
      });
    };

    notifyVisibility();

    socket?.on('connect', notifyVisibility);

    const handleFocus = () => notifyVisibility();
    const handleBlur = () => {
      if (document.visibilityState === 'hidden') {
        socket?.emit('visibility:changed', {
          conversationId,
          isFocused: false,
          isOpen: false,
        });
      } else {
        notifyVisibility();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        socket?.emit('visibility:changed', {
          conversationId,
          isFocused: false,
          isOpen: false,
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
      socket?.off('connect', notifyVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      try {
        socket?.emit('visibility:changed', {
          conversationId: null,
          isFocused: false,
          isOpen: false,
        });
      } catch {
        // Socket may not be available or connected
      }
    };
  }, [conversationId]);
}
