import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventChatRoomView } from './event-chat-room-view';

const mocks = vi.hoisted(() => ({
  useParams: vi.fn(),
  useEventRoom: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: mocks.useParams,
}));

vi.mock('../hooks/use-event-room', () => ({
  useEventRoom: mocks.useEventRoom,
}));

const baseRoom = {
  conversationId: null,
  isJoined: false,
  error: null,
  joinEventRoom: vi.fn(),
  leaveEventRoom: vi.fn(),
};

describe('EventChatRoomView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useParams.mockReturnValue({ id: 'event-1' });
    mocks.useEventRoom.mockReturnValue({ ...baseRoom });
  });

  it('should render the joining state', () => {
    render(<EventChatRoomView />);

    expect(screen.getByText('Uniéndose al evento')).toBeInTheDocument();
  });

  it('should render the joined room with its messages', () => {
    mocks.useEventRoom.mockReturnValue({
      ...baseRoom,
      conversationId: 'conv-1',
      isJoined: true,
    });

    render(<EventChatRoomView />);

    expect(screen.getByText('Sala de evento')).toBeInTheDocument();
    expect(screen.getByText('Mensajes cargados')).toBeInTheDocument();
  });

  it('should show the not registered message', () => {
    mocks.useEventRoom.mockReturnValue({
      ...baseRoom,
      error: 'not_registered',
    });

    render(<EventChatRoomView />);

    expect(screen.getByText('No registrado')).toBeInTheDocument();
  });

  it('should request to join the event when it is not joined', () => {
    const joinEventRoom = vi.fn();
    mocks.useEventRoom.mockReturnValue({ ...baseRoom, joinEventRoom });

    render(<EventChatRoomView />);

    expect(joinEventRoom).toHaveBeenCalledWith('event-1');
  });

  it('should leave the room when the event id is missing', () => {
    const leaveEventRoom = vi.fn();
    mocks.useParams.mockReturnValue({ id: undefined });
    mocks.useEventRoom.mockReturnValue({ ...baseRoom, leaveEventRoom });

    render(<EventChatRoomView />);

    expect(leaveEventRoom).toHaveBeenCalled();
  });
});
