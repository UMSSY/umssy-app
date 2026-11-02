import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CvHistoryController } from '../controllers/cv-history.controller.js';
import { CvNotFoundException } from '../exceptions/cv-not-found.exception.js';
import type { CvService } from '../services/cv.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';

const response = {
  id: cvId,
  fileName: 'CV-Test-User.pdf',
  fileType: 'application/pdf',
  sizeInBytes: 1024,
  updatedAt: '2026-10-03T12:00:00.000Z',
  isCurrent: true,
};

describe('CvHistoryController', () => {
  let controller: CvHistoryController;
  let service: {
    list: ReturnType<typeof vi.fn>;
    upload: ReturnType<typeof vi.fn>;
    removeById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = { list: vi.fn(), upload: vi.fn(), removeById: vi.fn() };
    controller = new CvHistoryController(service as unknown as CvService);
  });

  it('lists the cvs of the current user with the requested page', async () => {
    const page = { items: [response], totalItems: 1, totalPages: 1, page: 1, limit: 5 };
    service.list.mockResolvedValue(page);

    await expect(controller.list(userId, { page: 1, limit: 5 })).resolves.toBe(page);
    expect(service.list).toHaveBeenCalledWith(userId, { page: 1, limit: 5 });
  });

  it('uploads a new cv for the current user', async () => {
    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: 4,
      buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
    };
    service.upload.mockResolvedValue(response);

    await expect(controller.upload(userId, file)).resolves.toBe(response);
    expect(service.upload).toHaveBeenCalledWith(userId, file);
  });

  it('removes the requested cv and returns null', async () => {
    service.removeById.mockResolvedValue(undefined);

    await expect(controller.remove(userId, cvId)).resolves.toBeNull();
    expect(service.removeById).toHaveBeenCalledWith(userId, cvId);
  });

  it('propagates the not found error of another user cv', async () => {
    service.removeById.mockRejectedValue(new CvNotFoundException());

    await expect(controller.remove(userId, cvId)).rejects.toBeInstanceOf(CvNotFoundException);
  });
});
