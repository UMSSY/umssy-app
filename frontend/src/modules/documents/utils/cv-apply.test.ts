import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { educationsService } from "@/modules/education/services/educations.service";
import { profileService } from "@/modules/profile/services/profile.service";
import type { ProfileResponse } from "@/modules/profile";
import { skillsService } from "@/modules/skills/services/skills.service";
import { workExperienceService } from "@/modules/work-experience/services/work-experience.service";
import type { CvApplyTask } from "../types/cv-apply-task.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { buildCvApplyReport } from "./build-cv-apply-report";
import { buildCvApplyTasks } from "./build-cv-apply-tasks";
import { buildCvPersonalInfoValues } from "./build-cv-personal-info-values";
import { removeAppliedCvSelection } from "./remove-applied-cv-selection";
import { runCvApplyTasks } from "./run-cv-apply-tasks";

vi.mock("@/modules/profile/services/profile.service", () => ({
  profileService: { updatePersonalInfo: vi.fn(), updatePresentation: vi.fn() },
}));
vi.mock("@/modules/education/services/educations.service", () => ({
  educationsService: { createEducation: vi.fn() },
}));
vi.mock("@/modules/work-experience/services/work-experience.service", () => ({
  workExperienceService: { createWorkExperience: vi.fn() },
}));
vi.mock("@/modules/skills/services/skills.service", () => ({
  skillsService: { getMySkills: vi.fn(), saveMySkills: vi.fn() },
}));

const PROFILE: ProfileResponse = {
  id: "user-1",
  firstName: "Ana",
  lastName: "Rojas",
  institutionalEmail: "ana@umss.edu",
  personalEmail: null,
  phone: "70000000",
  city: { id: "city-lpz", title: "La Paz" },
  headline: "Dev",
  aboutMe: null,
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const EDUCATION_ITEM = {
  institution: "UCB",
  degree: "Maestría",
  startDate: "2020-01-01",
  endDate: "2021-01-01",
  description: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const WORK_ITEM = {
  companyName: "Empresa SRL",
  position: "Desarrolladora",
  startDate: "2021-03-01",
  endDate: null,
  isCurrent: true,
  description: "APIs",
};

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: {
    firstName: " Ana María ",
    lastName: "Rojas Vega",
    email: "ana@mail.com",
    phone: "   ",
    location: "Cochabamba",
    cityId: "city-cbba",
  },
  presentation: { headline: " Ingeniera ", aboutMe: " Desarrolladora web " },
  educations: [
    { institution: "UMSS", degree: "Licenciatura", startDate: "2014-01-01", endDate: "2019-01-01", description: " " },
    { institution: "UCB", degree: "Maestría", startDate: "2020-01-01", endDate: "2021-01-01", description: null },
  ],
  workExperiences: [
    {
      companyName: "Empresa SRL",
      position: "Desarrolladora",
      startDate: "2021-03-01",
      endDate: "2022-01-01",
      isCurrent: true,
      description: "APIs",
    },
  ],
  skills: [
    { skillId: "skill-ts", name: "TypeScript" },
    { skillId: "skill-sql", name: "SQL" },
  ],
};

const SELECTION: CvExtractionSelection = {
  contact: ["firstName", "email", "phone", "cityId"],
  presentation: [0],
  education: [1],
  experience: [0],
  skills: [1],
};

const task = (label: string, run: () => Promise<unknown>, items: number[] = [0]): CvApplyTask => ({
  section: "education",
  items,
  label,
  run,
});

describe("buildCvPersonalInfoValues", () => {
  it("keeps the profile values and replaces only the selected non empty fields", () => {
    expect(buildCvPersonalInfoValues(PROFILE, EXTRACTION.contact, SELECTION.contact)).toEqual({
      firstName: "Ana María",
      lastName: "Rojas",
      cityId: "city-cbba",
      phone: "70000000",
      personalEmail: "ana@mail.com",
    });
  });
});

describe("buildCvApplyTasks", () => {
  beforeEach(() => {
    vi.mocked(profileService.updatePersonalInfo).mockResolvedValue(PROFILE);
    vi.mocked(profileService.updatePresentation).mockResolvedValue(PROFILE);
    vi.mocked(educationsService.createEducation).mockResolvedValue({ id: "edu-1", ...EDUCATION_ITEM });
    vi.mocked(workExperienceService.createWorkExperience).mockResolvedValue({ id: "exp-1", ...WORK_ITEM });
    vi.mocked(skillsService.getMySkills).mockResolvedValue([{ id: "skill-ts", name: "TypeScript" }]);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saves only the selected data with the existing profile services", async () => {
    const tasks = buildCvApplyTasks(EXTRACTION, SELECTION, PROFILE);

    await runCvApplyTasks(tasks);

    expect(tasks.map(({ label }) => label)).toEqual([
      "Contacto",
      "Presentación",
      "Formación académica: Maestría",
      "Experiencia laboral: Desarrolladora",
      "Habilidades técnicas (1)",
    ]);
    expect(profileService.updatePersonalInfo).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Ana María" }));
    expect(profileService.updatePresentation).toHaveBeenCalledWith({ headline: "Ingeniera", aboutMe: "Desarrolladora web" });
    expect(educationsService.createEducation).toHaveBeenCalledTimes(1);
    expect(educationsService.createEducation).toHaveBeenCalledWith({
      institution: "UCB",
      degree: "Maestría",
      startDate: "2020-01-01",
      endDate: "2021-01-01",
      description: null,
    });
    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith({
      companyName: "Empresa SRL",
      position: "Desarrolladora",
      startDate: "2021-03-01",
      endDate: null,
      isCurrent: true,
      description: "APIs",
    });
    expect(skillsService.saveMySkills).toHaveBeenCalledWith(["skill-ts", "skill-sql"]);
  });

  it("creates no task for unselected sections", () => {
    const tasks = buildCvApplyTasks(
      EXTRACTION,
      { contact: [], presentation: [], education: [], experience: [], skills: [] },
      PROFILE,
    );

    expect(tasks).toEqual([]);
  });

  it("fails the contact task when the profile is not loaded", async () => {
    const [contactTask] = buildCvApplyTasks(EXTRACTION, { ...SELECTION, presentation: [] }, null);

    await expect(contactTask.run()).rejects.toThrow("No se pudo cargar tu perfil");
    expect(profileService.updatePersonalInfo).not.toHaveBeenCalled();
  });
});

describe("runCvApplyTasks", () => {
  it("runs every task in order and keeps going after a failure", async () => {
    const calls: string[] = [];
    const results = await runCvApplyTasks([
      task("A", async () => calls.push("A")),
      task("B", async () => {
        calls.push("B");
        throw new Error("boom");
      }),
      task("C", async () => calls.push("C")),
    ]);

    expect(calls).toEqual(["A", "B", "C"]);
    expect(results.map(({ isApplied }) => isApplied)).toEqual([true, false, true]);
    expect(buildCvApplyReport(results)).toEqual({ applied: ["A", "C"], failed: ["B"] });
  });
});

describe("removeAppliedCvSelection", () => {
  it("deselects only the items that were applied", () => {
    const results = [
      { task: { ...task("A", vi.fn()), section: "contact" as const, items: SELECTION.contact }, isApplied: true },
      { task: task("B", vi.fn(), [1]), isApplied: false },
      { task: { ...task("C", vi.fn()), section: "skills" as const, items: [1] }, isApplied: true },
    ];

    expect(removeAppliedCvSelection(SELECTION, results)).toEqual({ ...SELECTION, contact: [], skills: [] });
  });
});
