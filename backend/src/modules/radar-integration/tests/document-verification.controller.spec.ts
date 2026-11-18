import { StreamableFile } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DocumentVerificationController } from '../controllers/document-verification.controller.js';
import type { DocumentReviewService } from '../services/document-review.service.js';
import { RadarDocumentStatus } from '../constants/radar-document-status.enum.js';

describe('Document verification HTTP boundaries', () => {
  it('scopes owner operations to the session and administrative operations to the requested resource', async () => {
    const service = {
      history: vi.fn(),
      acknowledge: vi.fn(),
      reviews: vi.fn(),
      decide: vi.fn(),
      file: vi
        .fn()
        .mockResolvedValue({
          content: Buffer.from('pdf'),
          mime: 'application/pdf',
        }),
    };
    const controller = new DocumentVerificationController(
      service as unknown as DocumentReviewService,
    );
    await controller.history('owner');
    await controller.acknowledge('owner', 'version', {
      status: RadarDocumentStatus.APPROVED,
    });
    await controller.queue('pending');
    await controller.decide('admin', 'version', { decision: 'approved' });
    const ownFile = await controller.preview('owner', 'version');
    expect(service.file).toHaveBeenLastCalledWith('version', 'owner');
    expect(ownFile).toBeInstanceOf(StreamableFile);
    expect(ownFile.getHeaders()).toMatchObject({
      type: 'application/pdf',
      disposition: 'inline',
    });
    expect(ownFile.getStream()).toBeDefined();
    await controller.adminPreview('version');
    expect(service.file).toHaveBeenLastCalledWith('version', undefined);
    expect(service.history).toHaveBeenCalledWith('owner');
    expect(service.acknowledge).toHaveBeenCalledWith(
      'owner',
      'version',
      'approved',
    );
    expect(service.reviews).toHaveBeenCalledWith('pending');
    expect(service.decide).toHaveBeenCalledWith('admin', 'version', 'approved');
  });
});
