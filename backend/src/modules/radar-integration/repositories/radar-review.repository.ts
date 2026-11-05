import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

export type CvReview = {
  cv_id: string;
  user_id: string;
  extraction_status: string;
  review_status: string;
  submitted_at: Date;
  cv_file_name: string | null;
  extracted_chars: number;
};

@Injectable()
export class RadarReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  listReviewQueue() {
    return Promise.all([
      this.prisma.$queryRaw<(CvReview & { name: string })[]>`
        SELECT e.cv_id,e.user_id,e.extraction_status,e.review_status,e.submitted_at,
          CHAR_LENGTH(e.extracted_text) AS extracted_chars,c.cv_file_name,
          (u.first_name||' '||u.last_name) AS name
        FROM radar_cv_evidence e
        JOIN users u ON u.id=e.user_id
        JOIN user_cv_file c ON c.id=e.cv_id
        ORDER BY e.submitted_at DESC LIMIT 300`,
      this.prisma.userSkill.findMany({
        where: { verificationStatus: { in: ['pending', 'approved', 'rejected', 'revoked'] } },
        include: { skill: true, user: { select: { firstName: true, lastName: true } } },
        take: 300,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
  }

  changeCvDecision(adminId: string, cvId: string, action: string) {
    return this.prisma.$queryRaw<{ user_id: string; review_status: string }[]>`
      UPDATE radar_cv_evidence evidence
      SET review_status=${action},review_status_id=status.id,reviewer_id=${adminId}::uuid,decided_at=now()
      FROM radar_cv_review_statuses status
      WHERE evidence.cv_id=${cvId}::uuid AND evidence.review_status<>${action} AND status.title=${action}
      RETURNING evidence.user_id,evidence.review_status`;
  }

  cvOwner(cvId: string) {
    return this.prisma.$queryRaw<{ user_id: string }[]>`
      SELECT user_id FROM radar_cv_evidence WHERE cv_id=${cvId}::uuid`;
  }

  skillForDecision(skillId: string) {
    return this.prisma.userSkill.findUnique({
      where: { id: skillId },
      select: { userId: true, verificationStatus: true },
    });
  }

  changeSkillDecision(skillId: string, action: string) {
    return this.prisma.userSkill.updateMany({
      where: { id: skillId, verificationStatus: { not: action } },
      data: { verificationStatus: action },
    });
  }

  cvForAdmin(cvId: string) {
    return this.prisma.userCvFile.findFirst({
      where: { id: cvId },
      select: { userId: true, cvPdfData: true, cvFileName: true },
    });
  }
}
