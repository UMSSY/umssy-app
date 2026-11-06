import { Injectable } from '@nestjs/common';
import type { ReviewQueueRows } from '../types/review-queue-rows.type.js';

@Injectable()
export class RadarReviewMapper {
  queue([documents, skills]: ReviewQueueRows) {
    return [
      ...documents.map((d) => ({
        id: `cv:${d.cv_id}`,
        userId: d.user_id,
        userName: d.name,
        type: 'cv',
        title: d.cv_file_name ?? 'CV PDF',
        status: d.review_status,
        extractionStatus: d.extraction_status,
        extractedCharacters: d.extracted_chars,
        date: d.submitted_at,
      })),
      ...skills.map((s) => ({
        id: `skill:${s.id}`,
        userId: s.userId,
        userName: `${s.user.firstName} ${s.user.lastName}`,
        type: 'skill',
        title: s.skill.name,
        status: s.verificationStatus,
        date: s.createdAt,
        areaId: s.skill.areaId,
        evidenceRefs: s.evidenceRefs,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
