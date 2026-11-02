import { StreamableFile } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CvFileController } from '../controllers/cv-file.controller.js';
import { CvNotFoundException } from '../exceptions/cv-not-found.exception.js';
import type { CvService } from '../services/cv.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';
const content = Buffer.from([0x25, 0x50, 0x44, 0x46]);

describe('CvFileController', () => {
  let controller: CvFileController;
  let service: { getFileById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = { getFileById: vi.fn() };
    controller = new CvFileController(service as unknown as CvService);
  });

  it('streams the requested pdf of the user inline', async () => {
    service.getFileById.mockResolvedValue({
      content,
      fileName: 'old-resume.pdf',
      mimeType: 'application/pdf',
    });

    const result = await controller.downloadById(userId, cvId);

    expect(service.getFileById).toHaveBeenCalledWith(userId, cvId);
    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders()).toEqual({
      type: 'application/pdf',
      disposition: 'inline; filename="old-resume.pdf"',
      length: content.length,
    });
  });

  it('propagates the not found error when the cv belongs to another user', async () => {
    service.getFileById.mockRejectedValue(new CvNotFoundException());

    await expect(controller.downloadById(userId, cvId)).rejects.toBeInstanceOf(
      CvNotFoundException,
    );
  });
});
