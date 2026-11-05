import { describe, expect, it } from 'vitest';
import { ConversationMapper } from './conversation.mapper.js';
import type { RawConversationRecord } from '../types/raw-conversation-record.types.js';
import type { RawConversationUser } from '../types/raw-conversation-user.types.js';

describe('ConversationMapper', () => {
  const mapper = new ConversationMapper();

  it('maps direct conversation contact with role, email, academicTitle and skills', () => {
    const contactUser: RawConversationUser = {
      id: 'user-2',
      firstName: 'Carlos',
      lastName: 'Rojas Murillo',
      email: 'carlos.rojas@est.umss.edu',
      roles: [{ role: { name: 'titulado' } }],
    };

    const rawConversation: RawConversationRecord = {
      id: 'conv-123',
      userAId: 'user-1',
      userBId: 'user-2',
      userA: null,
      userB: contactUser,
      updatedAt: new Date('2026-03-01T12:00:00Z'),
      messages: [],
    };

    const result = mapper.toDirectConversationResponse({
      conversation: rawConversation,
      contact: contactUser,
      isOnline: true,
      unreadCount: 0,
      isBlockedByMe: false,
      academicTitle:
        'Lic. en Ingenieria de Sistemas / Universidad Mayor de San Simon',
      skills: ['TypeScript', 'NestJS'],
    });

    expect(result.id).toBe('conv-123');
    expect(result.contact).toBeDefined();
    expect(result.contact?.fullName).toBe('Carlos Rojas Murillo');
    expect(result.contact?.roleName).toBe('titulado');
    expect(result.contact?.role).toBe('titulado');
    expect(result.contact?.email).toBe('carlos.rojas@est.umss.edu');
    expect(result.contact?.academicTitle).toBe(
      'Lic. en Ingenieria de Sistemas / Universidad Mayor de San Simon',
    );
    expect(result.contact?.skills).toEqual(['TypeScript', 'NestJS']);
  });

  it('maps event conversation metadata and participants', () => {
    const rawConversation: RawConversationRecord = {
      id: 'conv-event-1',
      userAId: null,
      userBId: null,
      userA: null,
      userB: null,
      createdAt: new Date('2026-11-01T10:00:00Z'),
      updatedAt: new Date('2026-11-02T12:00:00Z'),
      messages: [],
      event: {
        id: 'event-1',
        title: 'Taller de React',
      },
      participants: [
        {
          userId: 'user-1',
          user: {
            id: 'user-1',
            firstName: 'Maria',
            lastName: 'Fernandez',
          },
        },
        {
          userId: 'user-2',
          user: {
            id: 'user-2',
            firstName: 'Carlos',
            lastName: 'Rojas',
          },
        },
      ],
    };

    const result = mapper.toEventConversationResponse(rawConversation);

    expect(result.eventId).toBe('event-1');
    expect(result.eventTitle).toBe('Taller de React');
    expect(result.createdAt).toBe('2026-11-01T10:00:00.000Z');
    expect(result.participants).toEqual([
      { id: 'user-1', fullName: 'Maria Fernandez' },
      { id: 'user-2', fullName: 'Carlos Rojas' },
    ]);
  });

  it('maps event room joined payload with formatted date and participants', () => {
    const params = {
      conversationId: 'conv-event-room-1',
      eventId: 'event-1',
      eventTitle: 'Taller de React',
      createdAt: new Date('2026-11-01T10:00:00Z'),
      participants: [
        {
          userId: 'user-1',
          user: { firstName: 'Maria', lastName: 'Fernandez' },
        },
        {
          userId: 'user-2',
          user: { firstName: 'Carlos', lastName: 'Rojas' },
        },
      ],
    };

    const result = mapper.toEventRoomJoinedPayload(params);

    expect(result).toEqual({
      conversationId: 'conv-event-room-1',
      eventId: 'event-1',
      name: 'Taller de React',
      createdAt: '2026-11-01T10:00:00.000Z',
      participants: [
        { id: 'user-1', fullName: 'Maria Fernandez' },
        { id: 'user-2', fullName: 'Carlos Rojas' },
      ],
    });
  });
});
