import { Injectable } from '@nestjs/common';

@Injectable()
export class CredentialSerialService {
  private readonly queues = new Map<string, Promise<void>>();

  async run<T>(key: string, action: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const completion = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => completion);
    this.queues.set(key, queued);

    await previous;
    try {
      return await action();
    } finally {
      release();
      if (this.queues.get(key) === queued) this.queues.delete(key);
    }
  }
}
