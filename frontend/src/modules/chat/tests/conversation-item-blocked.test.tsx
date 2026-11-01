import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConversationItem } from "../components/conversation-item";
import type { Conversation } from "../types/conversation.types";

const base: Conversation = {
  id: "conv-1",
  contact: { id: "user-1", fullName: "Maria Fernandez", avatarUrl: null, isOnline: true },
  lastMessage: {
    id: "msg-1",
    senderId: "user-1",
    content: "Hola, buenas tardes",
    createdAt: new Date().toISOString(),
  },
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

describe("ConversationItem · estado bloqueado", () => {
  afterEach(() => cleanup());

  it("muestra 'Bloqueado' en la conversación bloqueada", () => {
    render(<ConversationItem conversation={{ ...base, isBlockedByMe: true }} isSelected={false} onSelect={vi.fn()} />);

    expect(screen.getByTestId("conversation-blocked-label")).toHaveTextContent("Bloqueado");
    expect(screen.queryByText("Hola, buenas tardes")).not.toBeInTheDocument();
    expect(screen.queryByTitle("En línea")).not.toBeInTheDocument();
  });

  it("las demás conversaciones mantienen su estado normal", () => {
    render(<ConversationItem conversation={{ ...base, isBlockedByMe: false }} isSelected={false} onSelect={vi.fn()} />);

    expect(screen.queryByTestId("conversation-blocked-label")).not.toBeInTheDocument();
    expect(screen.getByText("Hola, buenas tardes")).toBeInTheDocument();
    expect(screen.getByTitle("En línea")).toBeInTheDocument();
  });
  it('renderiza una conversación de evento sin contacto', () => {
    const event: Conversation = {
      id: 'event-conversation', eventId: 'event-1', eventTitle: 'Taller de Prisma',
      lastMessage: null, unreadCount: 0, updatedAt: '2026-10-31T12:00:00.000Z',
    };
    render(<ConversationItem conversation={event} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Taller de Prisma')).toBeInTheDocument();
    expect(screen.queryByTitle('En línea')).not.toBeInTheDocument();
  });

});