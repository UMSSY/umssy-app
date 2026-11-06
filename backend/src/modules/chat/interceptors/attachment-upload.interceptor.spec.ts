import { describe, it, expect } from 'vitest';
import { of, throwError, lastValueFrom } from 'rxjs';
import { PayloadTooLargeException } from '@nestjs/common';
import { AttachmentUploadInterceptor } from './attachment-upload.interceptor.js';
import { AttachmentTooLargeException } from '../exceptions/attachment-too-large.exception.js';

describe('AttachmentUploadInterceptor', () => {
  const interceptor = new AttachmentUploadInterceptor();

  it('passes through successful observable results untouched', async () => {
    const mockContext = {} as any;
    const mockNext = {
      handle: () => of({ success: true, data: 'test' }),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockNext));
    expect(result).toEqual({ success: true, data: 'test' });
  });

  it('converts PayloadTooLargeException to AttachmentTooLargeException', async () => {
    const mockContext = {} as any;
    const mockNext = {
      handle: () => throwError(() => new PayloadTooLargeException('File too large')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(mockContext, mockNext)),
    ).rejects.toThrow(AttachmentTooLargeException);
  });

  it('rethrows other errors untouched', async () => {
    const mockContext = {} as any;
    const customError = new Error('Database down');
    const mockNext = {
      handle: () => throwError(() => customError),
    };

    await expect(
      lastValueFrom(interceptor.intercept(mockContext, mockNext)),
    ).rejects.toThrow('Database down');
  });
});
