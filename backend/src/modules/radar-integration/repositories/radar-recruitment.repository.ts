import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Scores } from '../radar-scoring.js';

export interface RecruiterSnapshot {
  user_id: string;
  version: number;
  scores: Scores;
  evidence: Record<string, { id: string; name: string }[]>;
  average_score: string | number;
  created_at: Date;
}

export interface ApprovedCvRow {
  cv_pdf_data: string | null;
}

/** Límite de persistencia para empresa, evidencias y CV autorizado. */
@Injectable()
export class RadarRecruitmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  companyExists(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
  }

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

  activeVacancies() {
    return this.prisma.jobOffer.findMany({
      where: {
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { skills: { include: { skill: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  recruiterVacancies(companyIds: string[]) {
    return this.prisma.jobOffer.findMany({
      where: {
        companyId: { in: companyIds },
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { skills: { include: { skill: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  publishedJob(jobId: string) {
    return this.prisma.jobOffer.findFirst({
      where: {
        id: jobId,
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { skills: { include: { skill: true } } },
    });
  }

  catalogSkills() {
    return this.prisma.skill.findMany({
      where: { isCustom: false, areaId: { not: null } },
      select: { name: true, areaId: true },
    });
  }

  candidate(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        headline: true,
        email: true,
        phone: true,
      },
    });
  }

  latestSnapshot(userId: string) {
    return this.prisma.$queryRaw<RecruiterSnapshot[]>`
      SELECT * FROM radar_score_snapshots WHERE user_id=${userId}::uuid
      ORDER BY version DESC LIMIT 1`;
  }

  approvedSkillReferences(userId: string, ids: string[]) {
    return this.prisma.userSkill.findMany({
      where: { userId, verificationStatus: 'approved', skillId: { in: ids } },
      select: { skillId: true, evidenceRefs: true },
    });
  }

  ownedEducation(userId: string, ids: string[]) {
    return this.prisma.education.findMany({
      where: { userId, id: { in: ids } },
      select: {
        id: true,
        degree: true,
        institution: true,
        startDate: true,
        description: true,
      },
    });
  }

  ownedCertifications(userId: string, ids: string[]) {
    return this.prisma.certification.findMany({
      where: { userId, id: { in: ids } },
      select: {
        id: true,
        name: true,
        issuingOrganization: true,
        issueDate: true,
      },
    });
  }

  ownedExperiences(userId: string, ids: string[]) {
    return this.prisma.workExperience.findMany({
      where: { userId, id: { in: ids } },
      select: {
        id: true,
        position: true,
        startDate: true,
        endDate: true,
        description: true,
        company: { select: { title: true } },
      },
    });
  }

  /**
   * CV aprobado y listo para compartir. El Epic guarda el PDF en
   * `user_cv_file.cv_pdf_data` (base64) y su estado en `radar_cv_evidence`.
   */
  approvedCv(userId: string) {
    return this.prisma.$queryRaw<ApprovedCvRow[]>`
      SELECT f.cv_pdf_data AS cv_pdf_data
      FROM radar_cv_evidence e
      JOIN radar_cv_review_statuses r ON r.id=e.review_status_id
      JOIN radar_cv_extraction_statuses x ON x.id=e.extraction_status_id
      JOIN user_cv_file f ON f.id=e.cv_id
      WHERE e.user_id=${userId}::uuid AND r.title='approved' AND x.title='ready'
      ORDER BY e.updated_at DESC LIMIT 1`;
  }
}
