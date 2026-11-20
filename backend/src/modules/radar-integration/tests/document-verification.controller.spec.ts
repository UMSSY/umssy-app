import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { documentDecisionSchema } from '../requests/document-verification.request.js';
import { StreamableFile } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DocumentVerificationController } from '../controllers/document-verification.controller.js';
import type { DocumentReviewService } from '../services/document-review.service.js';
import type { DocumentReviewDecisionService } from '../services/document-review-decision.service.js';
import { RadarDocumentStatus } from '../constants/radar-document-status.enum.js';

describe('Document verification HTTP boundaries', () => {
  it('scopes owner operations to the session and administrative operations to the requested resource', async () => {
    const service = {
      history: vi.fn(),
      acknowledge: vi.fn(),
      reviews: vi.fn(),
      revise: vi.fn(),
      file: vi.fn().mockResolvedValue({
        content: Buffer.from('pdf'),
        mime: 'application/pdf',
      }),
    };
    const decisions = { resolve: vi.fn(), operationStatus: vi.fn() };
    const operationId = '22222222-2222-4222-8222-222222222222';
    const controller = new DocumentVerificationController(
      service as unknown as DocumentReviewService,
      decisions as unknown as DocumentReviewDecisionService,
    );
    await controller.history('owner');
    await controller.acknowledge('owner', 'version', {
      status: RadarDocumentStatus.APPROVED,
    });
    await controller.queue('pending');
    await controller.decide('admin', 'version', {
      decision: 'approved',
      operationId,
    });
    await controller.operationStatus('admin', operationId);
    await controller.decide('admin', 'version', { decision: 'reprocess' });
    const pipe = new RequestValidationPipe(documentDecisionSchema);
    expect(() => pipe.transform({ decision: 'approved' })).toThrow();
    expect(() =>
      pipe.transform({ decision: 'revoke', userId: 'other' }),
    ).toThrow();
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
    expect(decisions.resolve).toHaveBeenCalledWith('admin', 'version', {
      decision: 'approved',
      operationId,
    });
    expect(decisions.resolve).toHaveBeenCalledWith('admin', 'version', {
      decision: 'reprocess',
    });
    expect(decisions.operationStatus).toHaveBeenCalledWith(
      'admin',
      operationId,
    );
  });
});
