import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CvExtractionController } from '../controllers/cv-extraction.controller.js';
import { CvUnreadableException } from '../exceptions/cv-unreadable.exception.js';
import type { CvExtractionService } from '../services/cv-extraction.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';

describe('CvExtractionController', () => {
  let service: { extract: ReturnType<typeof vi.fn> };
  let controller: CvExtractionController;

  beforeEach(() => {
    service = { extract: vi.fn() };
    controller = new CvExtractionController(
      service as unknown as CvExtractionService,
    );
  });

  it('returns the extraction of the requested cv', async () => {
    const extraction = {
      cvId,
      contact: {
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        location: null,
        cityId: null,
      },
      presentation: null,
      educations: [],
      workExperiences: [],
      skills: [],
    };
    service.extract.mockResolvedValue(extraction);

    await expect(controller.extract(userId, cvId)).resolves.toBe(extraction);
    expect(service.extract).toHaveBeenCalledWith(userId, cvId);
  });

  it('propagates extraction errors', async () => {
    service.extract.mockRejectedValue(new CvUnreadableException());

    await expect(controller.extract(userId, cvId)).rejects.toMatchObject({
      statusCode: 422,
      code: 'CV_UNREADABLE',
    });
  });
});
