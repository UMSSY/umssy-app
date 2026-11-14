import type { RecruiterSnapshot } from '../types/recruiter-snapshot.type.js';
import type { ApprovedCvId } from '../types/approved-cv-id.type.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

/** Límite de persistencia para empresa, evidencias y CV autorizado. */
@Injectable()
export class RadarRecruitmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async grantCompany(userId: string, companyId: string): Promise<void> {
    // RadarCompanyAccess usa clave compuesta (company_id,user_id) en el Epic.
    await this.prisma.$executeRaw`
      INSERT INTO radar_company_access (company_id,user_id)
      VALUES (${companyId}::uuid,${userId}::uuid)
      ON CONFLICT (company_id,user_id) DO NOTHING`;
  }

  allowedCompany(userId: string, companyId: string) {
    return this.prisma.$queryRaw<{ company_id: string }[]>`
      SELECT company_id FROM radar_company_access
      WHERE company_id=${companyId}::uuid AND user_id=${userId}::uuid`;
  }

  linkedCompanies(userId: string) {
    return this.prisma.$queryRaw<{ company_id: string }[]>`
      SELECT company_id FROM radar_company_access WHERE user_id=${userId}::uuid`;
  }

  latestSnapshot(userId: string) {
    return this.prisma.$queryRaw<RecruiterSnapshot[]>`
      SELECT * FROM radar_score_snapshots WHERE user_id=${userId}::uuid
      ORDER BY version DESC LIMIT 1`;
  }

  /** Identificador aprobado; el contenido del archivo pertenece al dominio CV. */
  approvedCvId(userId: string) {
    return this.prisma.$queryRaw<ApprovedCvId[]>`
      SELECT e.cv_id
      FROM radar_cv_evidence e
      JOIN radar_cv_review_statuses r ON r.id=e.review_status_id
      JOIN radar_cv_extraction_statuses x ON x.id=e.extraction_status_id
      WHERE e.user_id=${userId}::uuid AND r.title='approved' AND x.title='ready'
      ORDER BY e.updated_at DESC LIMIT 1`;
  }
}
