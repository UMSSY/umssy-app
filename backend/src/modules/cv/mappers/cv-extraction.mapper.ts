import { Injectable } from '@nestjs/common';
import type { CvExtractionResponse } from '../responses/cv-extraction.response.js';
import type { CvExtractionCatalogs } from '../types/cv-extraction-catalogs.type.js';
import { extractCvContact } from '../utils/extract-cv-contact.js';
import { extractCvEducations } from '../utils/extract-cv-educations.js';
import { extractCvPresentation } from '../utils/extract-cv-presentation.js';
import { extractCvWorkExperiences } from '../utils/extract-cv-work-experiences.js';
import { groupCvEntries } from '../utils/group-cv-entries.js';
import { resolveCvCityId } from '../utils/resolve-cv-city-id.js';
import { splitCvLines } from '../utils/split-cv-lines.js';
import { splitCvSections } from '../utils/split-cv-sections.js';

@Injectable()
export class CvExtractionMapper {
  toResponse(
    cvId: string,
    text: string,
    catalogs: CvExtractionCatalogs,
  ): CvExtractionResponse {
    const lines = splitCvLines(text);
    const sections = splitCvSections(lines);
    const contact = extractCvContact(sections.header, lines);
    return {
      cvId,
      contact: {
        ...contact,
        cityId: resolveCvCityId(contact.location, catalogs.cities),
      },
      presentation: extractCvPresentation(sections.presentation),
      educations: extractCvEducations(groupCvEntries(sections.education, true)),
      workExperiences: extractCvWorkExperiences(
        groupCvEntries(sections.experience),
      ),
      skills: [...catalogs.skills],
    };
  }
}
