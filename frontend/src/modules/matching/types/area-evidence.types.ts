import type { AreaEvidenceEducation } from "../types/area-evidence-education.types";
import type { AreaEvidenceCertification } from "../types/area-evidence-certification.types";
import type { AreaEvidenceExperience } from "../types/area-evidence-experience.types";

export interface AreaEvidence {
  education: AreaEvidenceEducation[];
  certifications: AreaEvidenceCertification[];
  experiences: AreaEvidenceExperience[];
  tags: string[];
}
