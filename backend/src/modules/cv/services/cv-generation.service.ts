import { Injectable } from "@nestjs/common";
import { ProfileService } from "../../profile/services/profile.service.js";
import { EducationsService } from "../../educations/services/educations.service.js";
import { WorkExperienceService } from "../../work-experience/services/work-experience.service.js";
import { UserSkillService } from "../../skills/services/user-skill.service.js";
import { CertificationRecordsService } from "../../certifications/services/certification-records.service.js";
import { CvPdfGeneratorService } from "./cv-pdf-generator.service.js";
import { CvGenerationMapper } from "../mappers/cv-generation.mapper.js";
import { CV_PDF_MIME_TYPE } from "../constants/cv-pdf.constants.js";
import type { GenerateCvRequest } from "../requests/generate-cv.request.js";
import type { CvFileDownload } from "../types/cv-file-download.type.js";

@Injectable()
export class CvGenerationService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly educationsService: EducationsService,
    private readonly workExperienceService: WorkExperienceService,
    private readonly userSkillService: UserSkillService,
    private readonly certificationRecordsService: CertificationRecordsService,
    private readonly cvPdfGeneratorService: CvPdfGeneratorService,
    private readonly cvGenerationMapper: CvGenerationMapper,
  ) {}

  async generateCv(
    userId: string,
    request?: GenerateCvRequest,
  ): Promise<CvFileDownload> {
    const profile = await this.profileService.getProfile(userId);

    const [educations, experiences, skills, certifications] =
      await Promise.all([
        this.educationsService.findAll(userId),
        this.workExperienceService.findAll(userId),
        this.userSkillService.getUserSkills(userId),
        this.certificationRecordsService.findManyByUserId(userId),
      ]);

    const cvData = this.cvGenerationMapper.toDocumentData({
      profile,
      educations,
      experiences,
      skills,
      certifications,
    });

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
