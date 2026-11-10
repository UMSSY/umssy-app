import { Injectable } from "@nestjs/common";
import { ProfileNotFoundException } from "../../profile/exceptions/profile-not-found.exception.js";
import { ProfileRepository } from "../../profile/repositories/profile.repository.js";
import { EducationsService } from "../../educations/services/educations.service.js";
import { WorkExperienceService } from "../../work-experience/services/work-experience.service.js";
import { UserSkillService } from "../../skills/services/user-skill.service.js";
import { CertificationRecordsService } from "../../certifications/services/certification-records.service.js";
import { CvPdfGeneratorService } from "./cv-pdf-generator.service.js";
import { CV_PDF_MIME_TYPE } from "../constants/cv-pdf.constants.js";
import type { GenerateCvRequest } from "../requests/generate-cv.request.js";
import type { CvDocumentData } from "../types/cv-document-data.type.js";
import type { CvFileDownload } from "../types/cv-file-download.type.js";

function formatDateField(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().substring(0, 10);
  }
  return String(value).substring(0, 10);
}

@Injectable()
export class CvGenerationService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly educationsService: EducationsService,
    private readonly workExperienceService: WorkExperienceService,
    private readonly userSkillService: UserSkillService,
    private readonly certificationRecordsService: CertificationRecordsService,
    private readonly cvPdfGeneratorService: CvPdfGeneratorService,
  ) {}

  async generateCv(
    userId: string,
    request?: GenerateCvRequest,
  ): Promise<CvFileDownload> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundException();
    }

    const [educations, experiences, skills, certifications] =
      await Promise.all([
        this.educationsService.findAll(userId),
        this.workExperienceService.findAll(userId),
        this.userSkillService.getUserSkills(userId),
        this.certificationRecordsService.findManyByUserId(userId),
      ]);

    const cvData: CvDocumentData = {
      personalInfo: {
        fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        headline: profile.headline ?? undefined,
        email: profile.email,
        phone: profile.phone ?? undefined,
        location: profile.city?.title ?? undefined,
      },
      summary: profile.aboutMe ?? undefined,
      workExperiences: experiences.map((exp) => ({
        jobTitle: exp.position,
        company: exp.companyName,
        startDate: formatDateField(exp.startDate) ?? "",
        endDate: formatDateField(exp.endDate),
        isCurrent: exp.isCurrent,
        description: exp.description ?? undefined,
      })),
      educations: educations.map((edu) => ({
        degree: edu.degree,
        institution: edu.institution,
        startDate: formatDateField(edu.startDate) ?? "",
        endDate: formatDateField(edu.endDate),
        description: edu.description ?? undefined,
      })),
      skills: skills.map((s) => ({
        name: s.name,
      })),
      certifications: certifications.map((c) => ({
        title: c.name,
        issuingOrganization: c.issuingOrganization,
        issueDate: formatDateField(c.issueDate) ?? "",
      })),
    };

    const buffer = this.cvPdfGeneratorService.generate(cvData, {
      sections: request?.sections,
      customTitle: request?.customTitle,
    });

    const rawName = `${profile.firstName}_${profile.lastName}`;
    const cleanName = rawName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `CV_${cleanName}.pdf`;

    return {
      content: buffer,
      fileName,
      mimeType: CV_PDF_MIME_TYPE,
    };
  }
}
