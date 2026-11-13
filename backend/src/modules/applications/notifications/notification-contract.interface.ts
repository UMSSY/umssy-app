export interface NotifyRequest<T = Record<string, any>> {
  recipientId: string;
  type: string;
  context: T;
}

export interface NotifyResult {
  success: boolean;
  messageId?: string;
}