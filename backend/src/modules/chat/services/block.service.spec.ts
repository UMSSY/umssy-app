import { describe, expect, it, vi } from 'vitest';
import { BlockService } from './block.service.js';
import type { ChatUserBlockRepository } from '../repositories/chat-user-block.repository.js';
import type { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import {
  BlockNotFoundException,
  CannotBlockSelfException,
  InvalidBlockTargetException,
  UserAlreadyBlockedException,
  UserNotFoundException,
} from '../exceptions/index.js';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

const createService = () => {
  const blockRepository = {
    createBlock: vi.fn(),
    removeBlock: vi.fn(),
    findByUsers: vi.fn().mockResolvedValue(null),
    isBlockedBetween: vi.fn().mockResolvedValue(false),
    findBlockedIdsBy: vi.fn().mockResolvedValue([]),
  };
  const userLookupRepository = {
    findById: vi.fn().mockResolvedValue({ id: OTHER, isActive: true }),
  };
  const service = new BlockService(
    blockRepository as unknown as ChatUserBlockRepository,
    userLookupRepository as unknown as UserLookupRepository,
  );
  return { service, blockRepository, userLookupRepository };
};

describe('BlockService', () => {
  describe('block', () => {
    it('bloquea al usuario y devuelve { blockedUserId, createdAt }', async () => {
      const { service, blockRepository } = createService();
      const createdAt = new Date('2026-10-28T12:00:00.000Z');
      blockRepository.createBlock.mockResolvedValue({ blockerId: ME, blockedId: OTHER, createdAt });

      const result = await service.block(ME, OTHER);

      expect(blockRepository.createBlock).toHaveBeenCalledWith(ME, OTHER);
      expect(result).toEqual({ blockedUserId: OTHER, createdAt: createdAt.toISOString() });
    });

    it('normaliza mayúsculas del UUID', async () => {
      const { service, blockRepository } = createService();
      blockRepository.createBlock.mockResolvedValue({ blockedId: OTHER, createdAt: new Date() });

      await service.block(ME, OTHER.toUpperCase());

      expect(blockRepository.createBlock).toHaveBeenCalledWith(ME, OTHER);
    });

    it('rechaza bloquearse a sí mismo (400), incluso con distinto casing', async () => {
      const { service, blockRepository } = createService();

      await expect(service.block(ME, ME.toUpperCase())).rejects.toThrow(CannotBlockSelfException);
      expect(blockRepository.createBlock).not.toHaveBeenCalled();
    });

    it('rechaza un id inválido (400)', async () => {
      const { service } = createService();
      await expect(service.block(ME, 'no-es-uuid')).rejects.toThrow(InvalidBlockTargetException);
    });

    it('usuario inexistente → 404', async () => {
      const { service, userLookupRepository } = createService();
      userLookupRepository.findById.mockResolvedValue(null);

      await expect(service.block(ME, OTHER)).rejects.toThrow(UserNotFoundException);
    });

    it('bloqueo duplicado → 409', async () => {
      const { service, blockRepository } = createService();
      blockRepository.findByUsers.mockResolvedValue({ id: 'block-1' });

      await expect(service.block(ME, OTHER)).rejects.toThrow(UserAlreadyBlockedException);
      expect(blockRepository.createBlock).not.toHaveBeenCalled();
    });

    it('bloqueo duplicado concurrente (P2002) → 409', async () => {
      const { service, blockRepository } = createService();
      blockRepository.createBlock.mockRejectedValue({ code: 'P2002' });

      await expect(service.block(ME, OTHER)).rejects.toThrow(UserAlreadyBlockedException);
    });

    it('otros errores se propagan', async () => {
      const { service, blockRepository } = createService();
      blockRepository.createBlock.mockRejectedValue(new Error('db down'));

      await expect(service.block(ME, OTHER)).rejects.toThrow('db down');
    });
  });

  describe('unblock', () => {
    it('elimina el bloqueo', async () => {
      const { service, blockRepository } = createService();
      blockRepository.removeBlock.mockResolvedValue({});

      await expect(service.unblock(ME, OTHER)).resolves.toBeUndefined();
      expect(blockRepository.removeBlock).toHaveBeenCalledWith(ME, OTHER);
    });

    it('desbloquear sin bloqueo previo (P2025) → 404', async () => {
      const { service, blockRepository } = createService();
      blockRepository.removeBlock.mockRejectedValue({ code: 'P2025' });

      await expect(service.unblock(ME, OTHER)).rejects.toThrow(BlockNotFoundException);
    });

    it('id inválido → 400', async () => {
      const { service } = createService();
      await expect(service.unblock(ME, 'x')).rejects.toThrow(InvalidBlockTargetException);
    });
  });

  describe('isBlockedBetween', () => {
    it('delega en isBlockedBetween (ambas direcciones)', async () => {
      const { service, blockRepository } = createService();
      blockRepository.isBlockedBetween.mockResolvedValue(true);

      await expect(service.isBlockedBetween(ME, OTHER)).resolves.toBe(true);
      await expect(service.isBlockedBetween(OTHER, ME)).resolves.toBe(true);
      expect(blockRepository.isBlockedBetween).toHaveBeenCalledWith(ME, OTHER);
      expect(blockRepository.isBlockedBetween).toHaveBeenCalledWith(OTHER, ME);
    });

    it('devuelve false si no hay bloqueo', async () => {
      const { service } = createService();
      await expect(service.isBlockedBetween(ME, OTHER)).resolves.toBe(false);
    });
  });

  describe('findBlockedIdsBy', () => {
    it('devuelve un Set con los ids bloqueados por el usuario', async () => {
      const { service, blockRepository } = createService();
      blockRepository.findBlockedIdsBy.mockResolvedValue([OTHER]);

      const ids = await service.findBlockedIdsBy(ME);

      expect(ids.has(OTHER)).toBe(true);
      expect(ids.size).toBe(1);
    });
  });
});