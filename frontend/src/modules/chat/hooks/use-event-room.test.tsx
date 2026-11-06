import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useEventRoom } from './use-event-room';

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler);
    }),
    off: vi.fn((event: string) => {
      handlers.delete(event);
    }),
  };

  return { handlers, socket };
});

vi.mock('../contexts/socket-context', () => ({
  useSocket: () => ({ socket: mocks.socket, isConnected: true }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('useEventRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handlers.clear();
  });

  it('should start with an empty state', () => {
    const { result } = renderHook(() => useEventRoom());

    expect(result.current.conversationId).toBeNull();
    expect(result.current.isJoined).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.room).toBeNull();
  });

  it('should emit the join event with the registration id', () => {
    const { result } = renderHook(() => useEventRoom());

    act(() => {
      result.current.joinEventRoom('registration-1');
    });

    expect(mocks.socket.emit).toHaveBeenCalledWith('event_room:join', {
      registrationId: 'registration-1',
    });
  });

  it('should update the state when the room is joined', () => {
    const { result } = renderHook(() => useEventRoom());

    act(() => {
      mocks.handlers.get('event_room:joined')?.({
        conversationId: 'conv-1',
        eventId: 'event-1',
        name: 'Taller de React',
        createdAt: '2026-11-01T10:00:00.000Z',
        participants: [{ id: 'user-1', fullName: 'Maria Fernandez' }],
      });
    });

    expect(result.current.conversationId).toBe('conv-1');
    expect(result.current.isJoined).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.room).toEqual({
      conversationId: 'conv-1',
      eventId: 'event-1',
      name: 'Taller de React',
      createdAt: '2026-11-01T10:00:00.000Z',
      participants: [{ id: 'user-1', fullName: 'Maria Fernandez' }],
    });
  });

  it('should set the error state for a generic room error', () => {
    const { result } = renderHook(() => useEventRoom());

    act(() => {
      mocks.handlers.get('event_room:error')?.({ code: 'generic_error' });
    });

    expect(result.current.error).toBe('generic_error');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should show a toast when the user is not registered', () => {
    const { result } = renderHook(() => useEventRoom());

    act(() => {
      mocks.handlers.get('event_room:error')?.({ code: 'not_registered' });
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Solo los asistentes registrados pueden entrar',
      expect.objectContaining({
        description: 'No tienes una inscripción confirmada para este evento.',
      }),
    );
    expect(result.current.error).toBe('not_registered');
  });

  it('should reset the state when leaving the room', () => {
    const { result } = renderHook(() => useEventRoom());

    act(() => {
      mocks.handlers.get('event_room:joined')?.({
        conversationId: 'conv-1',
        eventId: 'event-1',
        name: 'Taller de React',
        createdAt: '2026-11-01T10:00:00.000Z',
        participants: [],
      });
    });

    act(() => {
      result.current.leaveEventRoom();
    });

    expect(result.current.conversationId).toBeNull();
    expect(result.current.isJoined).toBe(false);
    expect(result.current.room).toBeNull();
  });

  it('should remove the socket listeners on unmount', () => {
    const { unmount } = renderHook(() => useEventRoom());

    unmount();

    expect(mocks.socket.off).toHaveBeenCalledWith(
      'event_room:joined',
      expect.any(Function),
    );
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'event_room:error',
      expect.any(Function),
    );
  });
});
