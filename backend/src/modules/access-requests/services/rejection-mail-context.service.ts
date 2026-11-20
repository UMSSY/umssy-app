import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { RejectionMailContext } from '../types/rejection-mail.types.js';

@Injectable()
export class RejectionMailContextService {
  private readonly storage = new AsyncLocalStorage<RejectionMailContext>();

  // Propaga el ID ya conocido por notify sin cambiar la firma de MailSender.
  // Cada ejecución conserva su contexto aunque haya varios rechazos simultáneos.
  run<T>(accessRequestId: string, callback: () => T): T {
    return this.storage.run(Object.freeze({ accessRequestId }), callback);
  }

  getCurrent(): RejectionMailContext | undefined {
    return this.storage.getStore();
  }
}
