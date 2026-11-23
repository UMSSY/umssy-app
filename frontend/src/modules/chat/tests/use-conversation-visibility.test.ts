import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useConversationVisibility } from '../hooks/use-conversation-visibility';
import { getActiveConversationId } from '../services/active-conversation';
import { getChatSocket } from '../services/chat-socket';

vi.mock('../services/chat-socket', () => ({
  getChatSocket: vi.fn(),
}));

describe('useConversationVisibility', () => {
  const mockEmit = vi.fn();
  const mockSocket = {
    emit: mockEmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getChatSocket as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockSocket,
    );
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits visibility:changed on mount with conversationId and isFocused: true', () => {
    renderHook(() => useConversationVisibility('conv-123'));

    expect(mockEmit).toHaveBeenCalledWith('visibility:changed', {
      conversationId: 'conv-123',
      isFocused: true,
    });
  });

  it('emits isFocused: false on window blur', () => {
    renderHook(() => useConversationVisibility('conv-123'));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(mockEmit).toHaveBeenCalledWith('visibility:changed', {
      conversationId: 'conv-123',
      isFocused: false,
    });
  });

  it('emits isFocused: true on window focus when document is visible', () => {
    renderHook(() => useConversationVisibility('conv-123'));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(mockEmit).toHaveBeenCalledWith('visibility:changed', {
      conversationId: 'conv-123',
      isFocused: true,
    });
  });

  it('emits isFocused: false when document becomes hidden', () => {
    renderHook(() => useConversationVisibility('conv-123'));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockEmit).toHaveBeenCalledWith('visibility:changed', {
      conversationId: 'conv-123',
      isFocused: false,
    });
  });

  it('emits conversationId: null and isFocused: false on unmount', () => {
    const { unmount } = renderHook(() => useConversationVisibility('conv-123'));

    mockEmit.mockClear();
    unmount();

    expect(mockEmit).toHaveBeenCalledWith('visibility:changed', {
      conversationId: null,
      isFocused: false,
    });
  });

  it('expone la conversación activa mientras está montado y la limpia al desmontar', () => {
    const { unmount } = renderHook(() => useConversationVisibility('conv-123'));

    expect(getActiveConversationId()).toBe('conv-123');

    unmount();

    expect(getActiveConversationId()).toBeNull();
  });
});
