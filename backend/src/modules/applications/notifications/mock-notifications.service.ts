import { Injectable, Logger } from '@nestjs/common';
import type { NotifyRequest, NotifyResult } from './notification-contract.interface.js';

@Injectable()
export class MockNotificationsService {
  private readonly logger = new Logger('MockNotificationsService');

  async notify<T>(request: NotifyRequest<T>): Promise<NotifyResult> {
    this.logger.log(
      `[MOCK NOTIFICATION SENT] Destinatario: ${request.recipientId} | Tipo: ${request.type}`,
    );
    this.logger.debug('Payload recibido:', JSON.stringify(request.context, null, 2));

    return { success: true, messageId: 'mock-id-12345' };
  }
}