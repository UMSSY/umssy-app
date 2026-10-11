import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChatRoom } from '../components/chat-room';
import { Conversation, Message } from '../types/conversation.types';

afterEach(() => {
  cleanup();
});

const conversation: Conversation = {
  id: 'conv-3',
  contact: { id: 'user-103', fullName: 'Mario Alcocer', avatarUrl: null, isOnline: true },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const attachmentMessage: Message = {
  id: 'msg-3-1',
  conversationId: 'conv-3',
  senderId: 'user-103',
  content: 'Te envie el documento de soporte en formato PDF.',
  timestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  status: 'sent',
  isAttachment: true,
  attachmentType: 'file',
  attachment: {
    name: 'documento-soporte.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    url: '/files/documento-soporte.pdf',
  },
};

describe('ChatRoom — archivo enviado por el contacto (QA HU-1)', () => {
  it('muestra el archivo junto al mensaje que lo acompana', () => {
    render(
      <ChatRoom
        conversation={conversation}
        messages={[attachmentMessage]}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />,
    );

    expect(screen.getByTestId('message-attachment-msg-3-1')).toBeDefined();
    expect(screen.getByText('documento-soporte.pdf')).toBeDefined();
    expect(screen.getByText('2 KB')).toBeDefined();
    expect(screen.getByText('Te envie el documento de soporte en formato PDF.')).toBeDefined();
  });

  it('el archivo se abre en una pestana nueva', () => {
    render(
      <ChatRoom
        conversation={conversation}
        messages={[attachmentMessage]}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />,
    );

    const link = screen.getByLabelText('Abrir archivo documento-soporte.pdf');
    expect(link.getAttribute('href')).toBe('/files/documento-soporte.pdf');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});