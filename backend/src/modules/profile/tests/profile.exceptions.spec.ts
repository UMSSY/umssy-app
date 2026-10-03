import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { EmptyFileException } from '../exceptions/empty-file.exception.js';
import { FileTooLargeException } from '../exceptions/file-too-large.exception.js';
import { InvalidFileTypeException } from '../exceptions/invalid-file-type.exception.js';

describe('profile file exceptions', () => {
  it.each([
    [new EmptyFileException(), 400, 'File is required and cannot be empty'],
    [
      new FileTooLargeException(),
      413,
      'File exceeds the maximum allowed size of 5 MB',
    ],
    [new InvalidFileTypeException(), 415, 'File type is not allowed'],
  ])(
    '%o uses the expected status and English message',
    (exception, statusCode, message) => {
      expect(exception).toBeInstanceOf(DomainException);
      expect(exception.statusCode).toBe(statusCode);
      expect(exception.message).toBe(message);
    },
  );

  it('is formatted by the global filter as the standard error response', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new DomainExceptionFilter().catch(new FileTooLargeException(), host);

    expect(status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith({
      statusCode: 413,
      data: null,
      detail: 'File exceeds the maximum allowed size of 5 MB',
      ok: false,
    });
  });
});
