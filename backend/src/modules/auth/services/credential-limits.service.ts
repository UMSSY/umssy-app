import { Injectable } from '@nestjs/common';
import {
  InjectThrottlerStorage,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { CREDENTIAL_LIMITS } from '../constants/credential-limits.constants.js';
import { CredentialLimitException } from '../exceptions/credential-limit.exception.js';
import type { CredentialOperation } from '../types/credential-operation.types.js';
import { credentialKey } from '../utils/credential-key.js';
import { CredentialSerialService } from './credential-serial.service.js';

@Injectable()
export class CredentialLimitsService {
  private readonly deadlines = new Map<string, number>();
  private lastSweep = 0;

  constructor(
    @InjectThrottlerStorage() private readonly storage: ThrottlerStorage,
    private readonly serial: CredentialSerialService,
  ) {}

  async run<T>(
    operation: CredentialOperation,
    email: string,
    action: () => Promise<T>,
  ): Promise<T> {
    const identity = credentialKey(email);
    const group = operation === 'login' ? 'login' : 'recovery';

    return this.serial.run(group + ':' + identity, async () => {
      this.sweep();
      this.checkDeadline(operation, identity);
      await this.reserveQuota(operation, identity);
      try {
        return await action();
      } catch (error) {
        await this.recordFailure(operation, identity, error);
        throw error;
      }
    });
  }

  private checkDeadline(
    operation: CredentialOperation,
    identity: string,
  ): void {
    const checkedOperation = operation === 'reset' ? 'verify' : operation;
    const key = checkedOperation + ':' + identity;
    const deadline = this.deadlines.get(key) ?? 0;
    if (deadline > Date.now()) {
      throw new CredentialLimitException(
        checkedOperation,
        (deadline - Date.now()) / 1000,
        checkedOperation === 'request',
      );
    }
    this.deadlines.delete(key);
  }

  private async reserveQuota(
    operation: CredentialOperation,
    identity: string,
  ): Promise<void> {
    if (operation !== 'request' && operation !== 'reset') return;

    const limit =
      operation === 'request'
        ? CREDENTIAL_LIMITS.requests
        : CREDENTIAL_LIMITS.confirmations;

    const record = await this.storage.increment(
      operation + ':' + identity,
      CREDENTIAL_LIMITS.windowMs,
      limit,
      0,
      operation,
    );

    if (record.isBlocked) {
      throw new CredentialLimitException(operation, record.timeToBlockExpire);
    }

    if (operation === 'request') {
      this.deadlines.set(
        operation + ':' + identity,
        Date.now() + CREDENTIAL_LIMITS.cooldownMs,
      );
    }
  }

  private async recordFailure(
    operation: CredentialOperation,
    identity: string,
    error: unknown,
  ): Promise<void> {
    if (!(error instanceof DomainException)) return;

    const failedOperation =
      operation === 'login' && error.code === 'INVALID_CREDENTIALS'
        ? 'login'
        : (operation === 'verify' || operation === 'reset') &&
            error.code === 'INVALID_RESET_CODE'
          ? 'verify'
          : null;

    if (!failedOperation) return;

    const record = await this.storage.increment(
      failedOperation + ':' + identity,
      CREDENTIAL_LIMITS.windowMs,
      CREDENTIAL_LIMITS.failures - 1,
      CREDENTIAL_LIMITS.blockMs,
      failedOperation,
    );

    if (record.isBlocked) {
      this.deadlines.set(
        failedOperation + ':' + identity,
        Date.now() + record.timeToBlockExpire * 1000,
      );
      throw new CredentialLimitException(
        failedOperation,
        record.timeToBlockExpire,
      );
    }
  }

  private sweep(): void {
    const now = Date.now();
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, deadline] of this.deadlines) {
      if (deadline <= now) this.deadlines.delete(key);
    }
  }
}
