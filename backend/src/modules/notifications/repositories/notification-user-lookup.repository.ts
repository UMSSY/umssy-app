import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import { ChatService } from '../../chat/services/chat.service.js';

@Injectable()
export class NotificationUserLookupRepository {
  constructor(
    private readonly usersService: UsersService,
    private readonly chatService: ChatService,
  ) {}

  findEmailByUserId(userId: string): Promise<string | null> {
  return this.usersService.findEmailById(userId);
}

  async hasBlockBetween(actorId: string, recipientId: string): Promise<boolean> {
    return this.chatService.hasBlockBetween(actorId, recipientId);
  }
}