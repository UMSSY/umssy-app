import { Injectable } from '@nestjs/common';

@Injectable()
export class AppVisibilityService {
  private readonly visibleSocketIdsByUser = new Map<string, Set<string>>();

  setVisibility(userId: string, socketId: string, visible: boolean): void {
    if (!visible) {
      this.removeConnection(userId, socketId);
      return;
    }

    const socketIds =
      this.visibleSocketIdsByUser.get(userId) ?? new Set<string>();
    socketIds.add(socketId);
    this.visibleSocketIdsByUser.set(userId, socketIds);
  }

  removeConnection(userId: string, socketId: string): void {
    const socketIds = this.visibleSocketIdsByUser.get(userId);
    if (!socketIds) return;

    socketIds.delete(socketId);
    if (socketIds.size === 0) this.visibleSocketIdsByUser.delete(userId);
  }

  isVisible(userId: string): boolean {
    return this.visibleSocketIdsByUser.has(userId);
  }
}
