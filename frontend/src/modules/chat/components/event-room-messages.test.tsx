import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { EventRoomMessages } from './event-room-messages';
import type { Message } from '../types/conversation.types';
import type { EventRoomParticipant } from '../types/event-room.types';

const now = new Date().toISOString();

const participants: EventRoomParticipant[] = [
  { id: 'user-1', fullName: 'Maria Fernandez' },
  { id: 'user-2', fullName: 'Carlos Rojas' },
];

const messages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-2',
    content: 'Hola, ¿cómo están?',
    timestamp: now,
    createdAt: now,
    status: 'sent',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'current-user',
    content: 'Bien, gracias.',
    timestamp: now,
    createdAt: now,
    status: 'sent',
  },
];

const avatarRootContextError = 'AvatarRootContext is missing';

describe('EventRoomMessages', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    cleanup();
  });

  it('renderiza mensajes ajenos con nombre, avatar y burbuja blanca', () => {
    render(
      <EventRoomMessages
        messages={messages}
        currentUserId="current-user"
        participants={participants}
      />,
    );

    expect(screen.getByText('Carlos Rojas')).toBeInTheDocument();
    expect(screen.getByText('Hola, ¿cómo están?')).toBeInTheDocument();
  });

  it('renderiza mensajes propios a la derecha con burbuja azul oscuro, sin nombre ni avatar', () => {
    render(
      <EventRoomMessages
        messages={messages}
        currentUserId="current-user"
        participants={participants}
      />,
    );

    const burbujaPropia = document.querySelector('.bg-accent');
    expect(burbujaPropia).not.toBeNull();
    expect(screen.getByText('Bien, gracias.')).toBeInTheDocument();
  });

  it('muestra "Participante" cuando el senderId no está en la lista', () => {
    const mensajeDesconocido: Message = {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'user-desconocido',
      content: 'Mensaje de nadie',
      timestamp: now,
      createdAt: now,
      status: 'sent',
    };

    render(
      <EventRoomMessages
        messages={[...messages, mensajeDesconocido]}
        currentUserId="current-user"
        participants={participants}
      />,
    );

    expect(screen.getByText('Participante')).toBeInTheDocument();
  });

  it('muestra el chip de día "HOY" al inicio', () => {
    render(
      <EventRoomMessages
        messages={messages}
        currentUserId="current-user"
        participants={participants}
      />,
    );

    expect(screen.getByText('HOY')).toBeInTheDocument();
  });

  it('muestra el estado vacío con 1 participante y 0 mensajes', () => {
    render(
      <EventRoomMessages
        messages={[]}
        currentUserId="current-user"
        participants={[participants[0]]}
        isEmpty
      />,
    );

    expect(
      screen.getByText(
        "Aún no hay mensajes. Envía el primero para comenzar la conversación.",
      ),
    ).toBeInTheDocument();
  });

  it('renderiza mensajes con 1 participante sin error de AvatarRootContext', () => {
    render(
      <EventRoomMessages
        messages={messages}
        currentUserId="current-user"
        participants={[participants[0]]}
      />,
    );

    expect(screen.getByText('Hola, ¿cómo están?')).toBeInTheDocument();
    expect(screen.getByText('Bien, gracias.')).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(avatarRootContextError),
    );
  });

  it('no lanza error de AvatarRootContext al renderizar con varios participantes', () => {
    render(
      <EventRoomMessages
        messages={messages}
        currentUserId="current-user"
        participants={participants}
      />,
    );

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(avatarRootContextError),
    );
  });
});
