import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventChatRoomView } from './event-chat-room-view';

const mocks = vi.hoisted(() => ({
  useEventRoom: vi.fn(),
  useChatConnection: vi.fn(),
  useMessages: vi.fn(),
  useSendEventRoomMessage: vi.fn(),
}));

vi.mock('../hooks/use-event-room', () => ({
  useEventRoom: mocks.useEventRoom,
}));
vi.mock('../hooks/use-chat-connection', () => ({
  useChatConnection: mocks.useChatConnection,
}));
vi.mock('../hooks/use-messages', () => ({
  useMessages: mocks.useMessages,
}));
vi.mock('../hooks/use-event-room-message', () => ({
  useSendEventRoomMessage: mocks.useSendEventRoomMessage,
}));

const baseRoom = {
  conversationId: 'conv-1',
  isJoined: true,
  error: null,
  room: {
    conversationId: 'conv-1',
    eventId: 'event-1',
    name: 'Taller de React 2026',
    createdAt: '2026-11-01T10:00:00.000Z',
    participants: [
      { id: 'user-1', fullName: 'Maria Fernandez' },
      { id: 'user-2', fullName: 'Carlos Rojas' },
    ],
  },
  joinEventRoom: vi.fn(),
  leaveEventRoom: vi.fn(),
};

const baseMessages = {
  data: [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-2',
      content: 'Hola grupo',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent' as const,
    },
  ],
  isError: false,
};

const baseSend = {
  send: vi.fn(),
  isSending: false,
  sendError: null,
  clearError: vi.fn(),
};

describe('EventChatRoomView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useEventRoom.mockReturnValue({ ...baseRoom });
    mocks.useChatConnection.mockReturnValue({
      status: 'connected',
      refreshMessages: vi.fn(),
    });
    mocks.useMessages.mockReturnValue({ ...baseMessages });
    mocks.useSendEventRoomMessage.mockReturnValue({ ...baseSend });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the room header with group name and participant count', () => {
    render(<EventChatRoomView registrationId="registration-1" />);

    expect(screen.getAllByText('Taller de React 2026').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2 participantes').length).toBeGreaterThan(0);
    expect(mocks.useChatConnection).toHaveBeenCalledWith('conv-1');
  });

  it('should render messages in the room', () => {
    render(<EventChatRoomView registrationId="registration-1" />);

    expect(screen.getByText('Hola grupo')).toBeInTheDocument();
  });

  it('should show the empty state when 1 participant and 0 messages', () => {
    mocks.useEventRoom.mockReturnValue({
      ...baseRoom,
      room: {
        ...baseRoom.room,
        participants: [{ id: 'user-1', fullName: 'Maria Fernandez' }],
      },
    });
    mocks.useMessages.mockReturnValue({ ...baseMessages, data: [] });

    render(<EventChatRoomView registrationId="registration-1" />);

    expect(
      screen.getByText(
        "Aún no hay mensajes. Envía el primero para comenzar la conversación.",
      ),
    ).toBeInTheDocument();
  });

  it('should keep the message bar visible when 1 participant and 0 messages', () => {
    mocks.useEventRoom.mockReturnValue({
      ...baseRoom,
      room: {
        ...baseRoom.room,
        participants: [{ id: 'user-1', fullName: 'Maria Fernandez' }],
      },
    });
    mocks.useMessages.mockReturnValue({ ...baseMessages, data: [] });

    render(<EventChatRoomView registrationId="registration-1" />);

    expect(
      screen.getByPlaceholderText('Escribe un mensaje al grupo...'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enviar')).toBeInTheDocument();
    expect(screen.getByTestId('event-room-conversation')).toHaveClass(
      'flex',
      'min-h-0',
      'flex-col',
    );
  });

  it('should show the joining state while not joined', () => {
    mocks.useEventRoom.mockReturnValue({
      ...baseRoom,
      isJoined: false,
      room: null,
    });

    render(<EventChatRoomView registrationId="registration-1" />);

    expect(screen.getByText('Uniéndose al evento…')).toBeInTheDocument();
  });

  it('should show the not registered error', () => {
    mocks.useEventRoom.mockReturnValue({
      ...baseRoom,
      error: 'not_registered',
      isJoined: false,
      room: null,
    });

    render(<EventChatRoomView registrationId="registration-1" />);

    expect(screen.getByText('No registrado')).toBeInTheDocument();
  });

  it('should request to join the room with the registration id', () => {
    mocks.useEventRoom.mockReturnValue({
      ...baseRoom,
      isJoined: false,
      room: null,
    });

    render(<EventChatRoomView registrationId="registration-1" />);

    expect(baseRoom.joinEventRoom).toHaveBeenCalledWith('registration-1');
  });

  it('should clear the input and call send on submit', async () => {
    const send = vi.fn().mockResolvedValue({
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'current-user',
      content: 'Nuevo mensaje',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent' as const,
    });
    mocks.useSendEventRoomMessage.mockReturnValue({
      ...baseSend,
      send,
    });

    render(<EventChatRoomView registrationId="registration-1" />);

    const textarea = screen.getByPlaceholderText('Escribe un mensaje al grupo...');
    fireEvent.input(textarea, { target: { value: 'Nuevo mensaje' } });
    fireEvent.click(screen.getByText('Enviar'));

    expect(send).toHaveBeenCalledWith('Nuevo mensaje');
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('should show send error when sending fails', async () => {
    const send = vi.fn().mockRejectedValue(new Error('Fallo de envío'));
    mocks.useSendEventRoomMessage.mockReturnValue({
      ...baseSend,
      send,
      sendError: 'Fallo de envío',
    });

    render(<EventChatRoomView registrationId="registration-1" />);

    expect(screen.getByText('Fallo de envío')).toBeInTheDocument();
  });
});
