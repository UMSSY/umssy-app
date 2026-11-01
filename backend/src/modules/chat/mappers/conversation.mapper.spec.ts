import { describe, expect, it } from 'vitest';
import { ConversationMapper } from './conversation.mapper.js';
import type { RawConversationRecord } from '../types/raw-conversation-record.types.js';
import type { RawConversationUser } from '../types/raw-conversation-user.types.js';

describe('ConversationMapper', () => {
  const mapper = new ConversationMapper();

  it('maps direct conversation contact with role, email, academicTitle and skills', () => {
    const rawConversation: RawConversationRecord = {
      id: 'conv-123',
      userAId: 'user-1',
      userBId: 'user-2',
      updatedAt: new Date('2026-03-01T12:00:00Z'),
      messages: [],
    };

    const contactUser: RawConversationUser = {
      id: 'user-2',
      firstName: 'Carlos',
      lastName: 'Rojas Murillo',
      email: 'carlos.rojas@est.umss.edu',
      roles: [{ role: { name: 'titulado' } }],
      educations: [
        {
          degree: 'Lic. en Ingenieria de Sistemas',
          institution: 'Universidad Mayor de San Simon',
        },
      ],
      userSkills: [
        { skill: { name: 'TypeScript' } },
        { skill: { name: 'NestJS' } },
      ],
    };

    const result = mapper.toDirectConversationResponse({
      conversation: rawConversation,
      contact: contactUser,
      isOnline: true,
      unreadCount: 0,
      isBlockedByMe: false,
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
});
