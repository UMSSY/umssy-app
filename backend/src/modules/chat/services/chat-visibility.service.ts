import { Injectable } from '@nestjs/common';
import type { SocketVisibilityState } from '../types/socket-visibility-state.types.js';

export type { SocketVisibilityState } from '../types/socket-visibility-state.types.js';

@Injectable()
export class ChatVisibilityService {
  private readonly visibilityByUser = new Map<
    string,
    Map<string, SocketVisibilityState>
  >();

  setConversationVisibility(
    userId: string,
    socketId: string,
    conversationId: string | null,
    isFocused: boolean,
  ): void {
    let userSockets = this.visibilityByUser.get(userId);
    if (!userSockets) {
      userSockets = new Map();
      this.visibilityByUser.set(userId, userSockets);
    }
    userSockets.set(socketId, { conversationId, isFocused });
  }

  removeSocket(userId: string, socketId: string): void {
    const userSockets = this.visibilityByUser.get(userId);
    if (!userSockets) return;

    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      this.visibilityByUser.delete(userId);
    }
  }

  isConversationOpen(userId: string, conversationId: string): boolean {
    const userSockets = this.visibilityByUser.get(userId);
    if (!userSockets || userSockets.size === 0) return false;

    for (const state of userSockets.values()) {
      if (state.conversationId === conversationId && state.isFocused) {
        return true;
      }
    }

    return false;
  }

  clear(): void {
    this.visibilityByUser.clear();
  }
}
