import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { ChatRoom } from '../components/chat-room';
import { MessageInputBar } from '../components/message-input-bar';
import { Conversation, Message } from '../types/conversation.types';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockConversation: Conversation = {
  id: 'conv-test-1',
  contact: {
    id: 'user-contact-1',
    fullName: 'Maria Fernandez',
    avatarUrl: null,
    isOnline: true,
  },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const mockEventConversation: Conversation = {
  id: 'event-conversation-1',
  eventId: 'event-1',
  eventTitle: 'Taller de Prisma',
  createdAt: '2026-11-01T10:00:00.000Z',
  participants: [
    { id: 'user-1', fullName: 'Maria Fernandez' },
    { id: 'user-2', fullName: 'Carlos Rojas' },
  ],
  lastMessage: null,
  unreadCount: 0,
  updatedAt: '2026-11-01T10:00:00.000Z',
};

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-test-1',
    senderId: 'user-contact-1',
    content: 'Hola, buenas tardes',
    timestamp: new Date().toISOString(),
    status: 'sent',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-test-1',
    senderId: 'current-user',
    content: 'Hola Maria, como estas?',
    timestamp: new Date().toISOString(),
    status: 'sent',
    createdAt: new Date().toISOString(),
  },
];

describe('ChatRoom Layout y Componentes Responsivos (HU-03 Tarea 3)', () => {
  it('debe mantener la barra de redaccion fija en la parte inferior con clases shrink-0 y border-t', () => {
    const onSend = vi.fn();
    const onChange = vi.fn();

    render(
      <MessageInputBar
        value="Texto de prueba"
        onChange={onChange}
        onSend={onSend}
      />
    );

    const inputBar = screen.getByTestId('message-input-bar');
    expect(inputBar).toBeDefined();
    expect(inputBar.className).toContain('shrink-0');
    expect(inputBar.className).toContain('border-t');
    expect(inputBar.className).toContain('bg-surface');

    const textarea = screen.getByTestId('message-textarea');
    expect(textarea).toBeDefined();
    expect(textarea.getAttribute('placeholder')).toBe('Escribe un mensaje...');

    const counter = screen.getByTestId('character-counter');
    expect(counter.textContent).toBe('15/500');

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDefined();
  });

  it('debe contar con contenedor de mensajes con scroll vertical independiente (overflow-y-auto)', () => {
    const onBack = vi.fn();
    const onSend = vi.fn();

    render(
      <ChatRoom
        conversation={mockConversation}
        messages={mockMessages}
        currentUserId="current-user"
        onBack={onBack}
        onSendMessage={onSend}
      />
    );

    const messagesContainer = screen.getByTestId('messages-container');
    expect(messagesContainer).toBeDefined();
    expect(messagesContainer.className).toContain('overflow-y-auto');
    expect(messagesContainer.className).toContain('flex-1');
    expect(messagesContainer.className).toContain('min-h-0');

    expect(screen.getByText('Hola, buenas tardes')).toBeDefined();
    expect(screen.getByText('Hola Maria, como estas?')).toBeDefined();
    expect(screen.getByTestId('messages-scroll-anchor')).toBeDefined();
  });

  it('debe responder adecuadamente en resoluciones moviles y permitir volver atras con el boton', () => {
    const onBack = vi.fn();
    const onSend = vi.fn();

    render(
      <ChatRoom
        conversation={mockConversation}
        messages={[]}
        currentUserId="current-user"
        onBack={onBack}
        onSendMessage={onSend}
      />
    );

    const backButton = screen.getByTestId('chat-back-button');
    expect(backButton).toBeDefined();
    expect(backButton.className).toContain('md:hidden');

    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Maria Fernandez')).toBeDefined();
    expect(screen.getByText('En línea')).toBeDefined();
  });

  it('muestra el icono del grupo y abre la informacion lateral desde la cabecera', async () => {
    render(
      <ChatRoom
        conversation={mockEventConversation}
        messages={[]}
        currentUserId="user-1"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByText('TP')).toBeInTheDocument();
    expect(screen.getByTestId('chat-room-group-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chat-event-participant-count')).toHaveTextContent(
      '2 participantes',
    );
    expect(screen.queryByText('Chat del evento')).not.toBeInTheDocument();
    expect(screen.queryByText(/Sala de chat con/)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Aún no hay mensajes. Envía el primero para comenzar la conversación.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('chat-contact-profile-trigger'));

    expect(await screen.findByText('Info del grupo')).toBeInTheDocument();
    expect(screen.getAllByText('2 participantes').length).toBeGreaterThan(0);
    expect(screen.getByText('Carlos Rojas')).toBeInTheDocument();
  });

  it('usa el singular cuando el grupo tiene un solo participante', () => {
    render(
      <ChatRoom
        conversation={{
          ...mockEventConversation,
          participants: [{ id: 'user-1', fullName: 'Maria Fernandez' }],
        }}
        messages={[]}
        currentUserId="user-1"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByTestId('chat-event-participant-count')).toHaveTextContent(
      '1 participante',
    );
  });

  it('abre la informacion lateral del grupo en el panel compacto de mensajes', async () => {
    render(
      <ChatRoom
        conversation={mockEventConversation}
        messages={[]}
        currentUserId="user-1"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
        isCompact
      />
    );

    expect(screen.getByTestId('chat-event-participant-count')).toHaveTextContent(
      '2 participantes',
    );

    fireEvent.click(screen.getByTestId('chat-contact-profile-trigger'));

    expect(await screen.findByText('Info del grupo')).toBeInTheDocument();
    expect(screen.getByText('Carlos Rojas')).toBeInTheDocument();
  });

  it('debe deshabilitar el boton de enviar cuando el input esta vacio', () => {
    const onSend = vi.fn();
    const onChange = vi.fn();

    render(
      <MessageInputBar
        value="   "
        onChange={onChange}
        onSend={onSend}
      />
    );

    const sendButton = screen.getByTestId('send-button') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);

    fireEvent.click(sendButton);
    expect(onSend).not.toHaveBeenCalled();
  });
});

