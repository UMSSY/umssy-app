import { describe, expect, it } from 'vitest';
import { RadarReviewMapper } from '../mappers/radar-review.mapper.js';
import type { ReviewQueueRows } from '../types/review-queue-rows.types.js';

describe('Administrative review queue provenance', () => {
  it('keeps CV and skill identities distinct and orders the combined queue by submission date', () => {
    const input = [
      [
        {
          cv_id: 'same-id',
          user_id: 'owner',
          name: 'Ana Rojas',
          cv_file_name: null,
          review_status: 'pending',
          extraction_status: 'ready',
          extracted_chars: 10,
          submitted_at: new Date('2026-11-15T12:00:00Z'),
        },
        {
          cv_id: 'named',
          user_id: 'owner',
          name: 'Ana Rojas',
          cv_file_name: 'CV.pdf',
          review_status: 'pending',
          extraction_status: 'ready',
          extracted_chars: 20,
          submitted_at: new Date('2026-11-14T12:00:00Z'),
        },
      ],
      [
        {
          id: 'same-id',
          userId: 'owner',
          user: { firstName: 'Ana', lastName: 'Rojas' },
          skill: { name: 'Docker', areaId: 'cloud-devops' },
          verificationStatus: 'pending',
          evidenceRefs: [{ type: 'cv', id: 'same-id' }],
          createdAt: new Date('2026-11-16T12:00:00Z'),
        },
      ],
    ] as unknown as ReviewQueueRows;
    const rows = new RadarReviewMapper().queue(input);
    expect(rows.map((row) => row.id)).toEqual([
      'skill:same-id',
      'cv:same-id',
      'cv:named',
    ]);
    expect(rows[0]).toMatchObject({
      userName: 'Ana Rojas',
      title: 'Docker',
      type: 'skill',
      areaId: 'cloud-devops',
    });
    expect(rows[1]).toMatchObject({
      title: 'CV PDF',
      type: 'cv',
      extractionStatus: 'ready',
      extractedCharacters: 10,
    });
    expect(rows[2]).toMatchObject({ title: 'CV.pdf' });
    expect(new RadarReviewMapper().queue([[], []])).toEqual([]);
  });
});
