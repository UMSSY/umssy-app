import { Controller, Get, type ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Throttle, ThrottlerModule } from '@nestjs/throttler';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompanyRequestRateLimitException } from '../exceptions/company-request-rate-limit.exception.js';
import { CompanyRequestThrottlerGuard } from '../guards/company-request-throttler.guard.js';

@Controller()
class LimitedController {
  @Get()
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  limited() {
    return 'ok';
  }
}

const handler = Object.getOwnPropertyDescriptor(LimitedController.prototype, 'limited')?.value as () => string;

function contextFor(ip: string, code: string): ExecutionContext {
  const request = { ip, params: { code }, headers: {} };
  const response = { header: () => response, setHeader: () => response };
  return {
    getClass: () => LimitedController,
    getHandler: () => handler,
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('CompanyRequestThrottlerGuard', () => {
  let guard: CompanyRequestThrottlerGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 2 }])],
      controllers: [LimitedController],
      providers: [CompanyRequestThrottlerGuard],
    }).compile();
    await module.init();
    guard = module.get(CompanyRequestThrottlerGuard);
  });

  it('bloquea con 429 al superar el límite para la misma IP y código', async () => {
    const context = contextFor('10.0.0.1', 'EMP-2026-0001');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);

    const error = await guard.canActivate(context).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CompanyRequestRateLimitException);
    expect((error as CompanyRequestRateLimitException).statusCode).toBe(429);
    expect((error as CompanyRequestRateLimitException).code).toBe('COMPANY_REQUEST_RATE_LIMIT');
  });

  it('cuenta por separado otro código u otra IP', async () => {
    for (let index = 0; index < 2; index += 1) {
      await guard.canActivate(contextFor('10.0.0.1', 'EMP-2026-0001'));
    }
    await expect(guard.canActivate(contextFor('10.0.0.1', 'EMP-2026-0002'))).resolves.toBe(true);
    await expect(guard.canActivate(contextFor('10.0.0.2', 'EMP-2026-0001'))).resolves.toBe(true);
  });

  it('normaliza el código a mayúsculas y tolera parámetros ausentes', async () => {
    const lower = contextFor('10.0.0.3', 'emp-2026-0001');
    await guard.canActivate(lower);
    await guard.canActivate(contextFor('10.0.0.3', 'EMP-2026-0001'));
    await expect(guard.canActivate(lower)).rejects.toBeInstanceOf(CompanyRequestRateLimitException);

    const noParams = contextFor('10.0.0.4', '');
    (noParams.switchToHttp().getRequest() as { params?: unknown }).params = undefined;
    await expect(guard.canActivate(noParams)).resolves.toBe(true);
  });
});
