import { describe, expect, it, vi } from 'vitest';
import { ConversationService } from '../services/conversation.service.js';
import type { ConversationRepository } from '../repositories/conversation.repository.js';
import type { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import type { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import type { UserPresenceService } from '../services/user-presence.service.js';
import {
  InactiveUserException,
  UserNotFoundException,
} from '../exceptions/index.js';

describe('HU8: validación del destinatario', () => {
  function setup(contact: { id: string; isActive: boolean } | null) {
    const findById = vi.fn().mockResolvedValue(contact);
    const findByOrderedPair = vi.fn();
    const createWithParticipants = vi.fn();

    const service = new ConversationService(
      {
        findByOrderedPair,
        createWithParticipants,
      } as unknown as ConversationRepository,
      {} as ConversationParticipantRepository,
      { findById } as unknown as UserLookupRepository,
      {} as UserPresenceService,
    );

    return {
      service,
      findById,
      findByOrderedPair,
      createWithParticipants,
    };
  }

  it('rechaza un destinatario inexistente sin crear una conversación', async () => {
    const context = setup(null);

    await expect(
      context.service.getOrCreate('usuario-actual', 'destinatario'),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(context.findById).toHaveBeenCalledWith('destinatario');
    expect(context.findByOrderedPair).not.toHaveBeenCalled();
    expect(context.createWithParticipants).not.toHaveBeenCalled();
  });

  it('rechaza un destinatario inactivo sin crear una conversación', async () => {
    const context = setup({
      id: 'destinatario',
      isActive: false,
    });

    await expect(
      context.service.getOrCreate('usuario-actual', 'destinatario'),
    ).rejects.toBeInstanceOf(InactiveUserException);

    expect(context.findByOrderedPair).not.toHaveBeenCalled();
    expect(context.createWithParticipants).not.toHaveBeenCalled();
  });
});