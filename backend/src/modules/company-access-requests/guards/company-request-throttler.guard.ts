import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CompanyRequestRateLimitException } from '../exceptions/company-request-rate-limit.exception.js';

@Injectable()
export class CompanyRequestThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    const params = request.params as { code?: unknown } | undefined;
    const code =
      typeof params?.code === 'string' ? params.code.trim().toUpperCase() : '';
    const ip = typeof request.ip === 'string' ? request.ip : '';
    return Promise.resolve(`${ip}:${code}`);
  }

  protected throwThrottlingException(
    _context: ExecutionContext,
  ): Promise<void> {
    throw new CompanyRequestRateLimitException();
  }
}
