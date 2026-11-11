import { Injectable } from '@nestjs/common';
import type { CvExtractionResponse } from '../responses/cv-extraction.response.js';
import { extractCvContact } from '../utils/extract-cv-contact.js';
import { extractCvEducations } from '../utils/extract-cv-educations.js';
import { extractCvWorkExperiences } from '../utils/extract-cv-work-experiences.js';
import { groupCvEntries } from '../utils/group-cv-entries.js';
import { splitCvLines } from '../utils/split-cv-lines.js';
import { splitCvSections } from '../utils/split-cv-sections.js';

@Injectable()
export class CvExtractionMapper {
  toResponse(cvId: string, text: string): CvExtractionResponse {
    const lines = splitCvLines(text);
    const sections = splitCvSections(lines);
    return {
      cvId,
      contact: extractCvContact(sections.header, lines),
      educations: extractCvEducations(groupCvEntries(sections.education, true)),
      workExperiences: extractCvWorkExperiences(
        groupCvEntries(sections.experience),
      ),
    };
  }
}
