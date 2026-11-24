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
    isOpen?: boolean,
  ): void {
    const normalizedUserId = userId.toLowerCase();
    let userSockets = this.visibilityByUser.get(normalizedUserId);
    if (!userSockets) {
      userSockets = new Map();
      this.visibilityByUser.set(normalizedUserId, userSockets);
    }
    userSockets.set(socketId, {
      conversationId: conversationId ? conversationId.toLowerCase() : null,
      isFocused,
      isOpen: isOpen ?? isFocused,
    });
  }

  removeSocket(userId: string, socketId: string): void {
    const normalizedUserId = userId.toLowerCase();
    const userSockets = this.visibilityByUser.get(normalizedUserId);
    if (!userSockets) return;

    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      this.visibilityByUser.delete(normalizedUserId);
    }
  }

  isConversationOpen(userId: string, conversationId: string): boolean {
    const userSockets = this.visibilityByUser.get(userId.toLowerCase());
    if (!userSockets || userSockets.size === 0) return false;

    const normalizedConvId = conversationId.toLowerCase();
    for (const state of userSockets.values()) {
      if (
        state.conversationId === normalizedConvId &&
        (state.isFocused || state.isOpen)
      ) {
        return true;
      }
    }

    return false;
  }

  clear(): void {
    this.visibilityByUser.clear();
  }
}
