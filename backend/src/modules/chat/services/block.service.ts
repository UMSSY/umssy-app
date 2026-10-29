import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ChatUserBlockRepository } from '../repositories/chat-user-block.repository.js';
import { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import {
  BlockNotFoundException,
  CannotBlockSelfException,
  InvalidBlockTargetException,
  UserAlreadyBlockedException,
  UserNotFoundException,
} from '../exceptions/index.js';
import type { BlockResponse } from '../responses/block.response.js';

const UNIQUE_VIOLATION_CODE = 'P2002';
const RECORD_NOT_FOUND_CODE = 'P2025';
const uuid = z.string().uuid();

function hasPrismaCode(error: unknown, code: string): boolean {
  return (error as { code?: string })?.code === code;
}

@Injectable()
export class BlockService {
  constructor(
    private readonly blockRepository: ChatUserBlockRepository,
    private readonly userLookupRepository: UserLookupRepository,
  ) {}

  async block(blockerId: string, blockedId: string): Promise<BlockResponse> {
    const [blocker, blocked] = this.normalize(blockerId, blockedId);
    if (blocker === blocked) throw new CannotBlockSelfException();

    const target = await this.userLookupRepository.findById(blocked);
    if (!target) throw new UserNotFoundException();

    if (await this.blockRepository.findByUsers(blocker, blocked)) {
      throw new UserAlreadyBlockedException();
    }

    try {
      const created = await this.blockRepository.createBlock(blocker, blocked);
      return {
        blockedUserId: created.blockedId,
        createdAt: created.createdAt.toISOString(),
      };
    } catch (error) {
      // Dos peticiones simultáneas: la restricción única responde 409, no 500.
      if (hasPrismaCode(error, UNIQUE_VIOLATION_CODE)) {
        throw new UserAlreadyBlockedException();
      }
      throw error;
    }
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const [blocker, blocked] = this.normalize(blockerId, blockedId);
    try {
      await this.blockRepository.removeBlock(blocker, blocked);
    } catch (error) {
      if (hasPrismaCode(error, RECORD_NOT_FOUND_CODE)) {
        throw new BlockNotFoundException();
      }
      throw error;
    }
  }

  isBlockedBetween(userAId: string, userBId: string): Promise<boolean> {
    return this.blockRepository.isBlockedBetween(
      userAId.trim().toLowerCase(),
      userBId.trim().toLowerCase(),
    );
  }

  async findBlockedIdsBy(userId: string): Promise<Set<string>> {
    const ids = await this.blockRepository.findBlockedIdsBy(
      userId.trim().toLowerCase(),
    );
    return new Set(ids);
  }

  private normalize(a: string, b: string): [string, string] {
    const na = (a ?? '').trim().toLowerCase();
    const nb = (b ?? '').trim().toLowerCase();
    if (!uuid.safeParse(nb).success) throw new InvalidBlockTargetException();
    return [na, nb];
  }
}