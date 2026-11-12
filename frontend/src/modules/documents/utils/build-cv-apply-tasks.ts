import { educationsService } from "@/modules/education";
import type { ProfileResponse } from "@/modules/profile";
import { profileService } from "@/modules/profile";
import { skillsService } from "@/modules/skills";
import { workExperienceService } from "@/modules/work-experience";
import { CV_APPLY_TEXTS } from "../constants/cv-apply.constants";
import { CV_EXTRACTION_SECTION_LABELS, CV_PRESENTATION_INDEX, CV_REVIEW_TEXTS } from "../constants/cv-extraction.constants";
import type { CvApplyTask } from "../types/cv-apply-task.types";
import type { CvExtractedEducation } from "../types/cv-extracted-education.types";
import type { CvExtractedSkill } from "../types/cv-extracted-skill.types";
import type { CvExtractedWorkExperience } from "../types/cv-extracted-work-experience.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { buildCvPersonalInfoValues } from "./build-cv-personal-info-values";

const trimOrNull = (value: string | null | undefined): string | null => (value ?? "").trim() || null;

function buildContactTask(
  extraction: CvExtraction,
  selection: CvExtractionSelection,
  profile: ProfileResponse | null,
): CvApplyTask[] {
  if (selection.contact.length === 0) return [];
  return [
    {
      section: "contact",
      items: selection.contact,
      label: CV_EXTRACTION_SECTION_LABELS.contact,
      run: () =>
        profile
          ? profileService.updatePersonalInfo(buildCvPersonalInfoValues(profile, extraction.contact, selection.contact))
          : Promise.reject(new Error(CV_APPLY_TEXTS.profileUnavailable)),
    },
  ];
}

function buildPresentationTask(extraction: CvExtraction, selection: CvExtractionSelection): CvApplyTask[] {
  if (!selection.presentation.includes(CV_PRESENTATION_INDEX)) return [];
  return [
    {
      section: "presentation",
      items: [CV_PRESENTATION_INDEX],
      label: CV_EXTRACTION_SECTION_LABELS.presentation,
      run: () =>
        profileService.updatePresentation({
          headline: (extraction.presentation?.headline ?? "").trim(),
          aboutMe: (extraction.presentation?.aboutMe ?? "").trim(),
        }),
    },
  ];
}

const toEducationTask = (education: CvExtractedEducation, index: number): CvApplyTask => ({
  section: "education",
  items: [index],
  label: `${CV_EXTRACTION_SECTION_LABELS.education}: ${(education.degree ?? "").trim() || CV_REVIEW_TEXTS.untitledEducation}`,
  run: () =>
    educationsService.createEducation({
      institution: (education.institution ?? "").trim(),
      degree: (education.degree ?? "").trim(),
      startDate: education.startDate ?? "",
      endDate: education.endDate ?? "",
      description: trimOrNull(education.description),
    }),
});

const toWorkExperienceTask = (experience: CvExtractedWorkExperience, index: number): CvApplyTask => ({
  section: "experience",
  items: [index],
  label: `${CV_EXTRACTION_SECTION_LABELS.experience}: ${(experience.position ?? "").trim() || CV_REVIEW_TEXTS.untitledExperience}`,
  run: () =>
    workExperienceService.createWorkExperience({
      companyName: (experience.companyName ?? "").trim(),
      position: (experience.position ?? "").trim(),
      startDate: experience.startDate ?? "",
      endDate: experience.isCurrent ? null : experience.endDate,
      isCurrent: experience.isCurrent,
      description: trimOrNull(experience.description),
    }),
});

async function addSkillsToProfile(skills: readonly CvExtractedSkill[]): Promise<unknown> {
  const current = await skillsService.getMySkills();
  const skillIds = [...new Set([...(current ?? []).map(({ id }) => id), ...skills.map(({ skillId }) => skillId)])];
  return skillsService.saveMySkills(skillIds);
}

function buildSkillsTask(extraction: CvExtraction, selection: CvExtractionSelection): CvApplyTask[] {
  const skills = (extraction.skills ?? []).filter((_, index) => selection.skills.includes(index));
  if (skills.length === 0) return [];
  return [
    {
      section: "skills",
      items: selection.skills,
      label: `${CV_EXTRACTION_SECTION_LABELS.skills} (${skills.length})`,
      run: () => addSkillsToProfile(skills),
    },
  ];
}

const pickSelected = <T,>(items: readonly T[] | null | undefined, indexes: readonly number[]) =>
  (items ?? []).flatMap((item, index) => (indexes.includes(index) ? [{ item, index }] : []));

export function buildCvApplyTasks(
  extraction: CvExtraction,
  selection: CvExtractionSelection,
  profile: ProfileResponse | null,
): CvApplyTask[] {
  return [
    ...buildContactTask(extraction, selection, profile),
    ...buildPresentationTask(extraction, selection),
    ...pickSelected(extraction.educations, selection.education).map(({ item, index }) => toEducationTask(item, index)),
    ...pickSelected(extraction.workExperiences, selection.experience).map(({ item, index }) =>
      toWorkExperienceTask(item, index),
    ),
    ...buildSkillsTask(extraction, selection),
  ];
}
