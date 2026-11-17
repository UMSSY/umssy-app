import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import { ChatService } from '../../chat/services/chat.service.js';
import type { UserContact } from '../../users/types/user-contact.types.js';

@Injectable()
export class NotificationUserLookupRepository {
  constructor(
    private readonly usersService: UsersService,
    private readonly chatService: ChatService,
  ) {}

  findEmailByUserId(userId: string): Promise<string | null> {
    return this.usersService.findEmailById(userId);
  }

  findContactByUserId(userId: string): Promise<UserContact | null> {
    return this.usersService.findContactById(userId);
  }

  async hasBlockBetween(actorId: string, recipientId: string): Promise<boolean> {
    return this.chatService.hasBlockBetween(actorId, recipientId);
  }
}