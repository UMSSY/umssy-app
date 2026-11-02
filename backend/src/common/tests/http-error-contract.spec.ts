import { HttpException, Logger, type ArgumentsHost } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../filters/domain-exception.filter.js';

afterEach(() => vi.restoreAllMocks());

describe('HTTP error normalization', () => {
  it.each([
    [new HttpException('Private details', 400), 400, 'VALIDATION_ERROR'],
    [new HttpException('Private details', 401), 401, 'UNAUTHENTICATED'],
    [new HttpException('Private details', 418), 418, 'HTTP_ERROR'],
    [new HttpException('Private details', 503), 503, 'INTERNAL_ERROR'],
    [new Error('Database credentials'), 500, 'INTERNAL_ERROR'],
    ['unexpected rejection', 500, 'INTERNAL_ERROR'],
  ])('preserves the status and hides unexpected details: %s', (error, statusCode, code) => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    new DomainExceptionFilter().catch(error, { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost);
    expect(status).toHaveBeenCalledWith(statusCode);
    expect(json).toHaveBeenCalledWith({ statusCode, ok: false, code, detail: expect.any(String), data: null });
    expect(JSON.stringify(json.mock.calls)).not.toContain('Private details');
    expect(JSON.stringify(json.mock.calls)).not.toContain('Database credentials');
  });
});
