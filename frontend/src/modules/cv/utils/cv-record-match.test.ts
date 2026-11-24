import { describe, expect, it } from "vitest";
import type { CvExistingEducation } from "../types/cv-existing-education.types";
import type { CvExistingWorkExperience } from "../types/cv-existing-work-experience.types";
import type { CvExtractedEducation } from "../types/cv-extracted-education.types";
import type { CvExtractedWorkExperience } from "../types/cv-extracted-work-experience.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvRecordMatcher } from "../types/cv-record-matcher.types";
import { createCvEducationNamesResolver } from "./create-cv-education-names-resolver";
import { matchCvExtractionRecords } from "./match-cv-extraction-records";
import { matchCvRecords } from "./match-cv-records";
import { mergeCvEducation } from "./merge-cv-education";
import { mergeCvWorkExperience } from "./merge-cv-work-experience";
import { normalizeCvMatchText } from "./normalize-cv-match-text";
import { toCvMatchKey } from "./to-cv-match-key";

const EXPERIENCE: CvExtractedWorkExperience = {
  companyName: "AndesSoft Solutions",
  position: "Desarrollador Backend Junior",
  startDate: "2024-01-01",
  endDate: "2026-10-01",
  isCurrent: false,
  description: "Servicios REST con Java",
};

const EXPERIENCE_RECORD: CvExistingWorkExperience = {
  id: "11111111-1111-4111-8111-111111111111",
  companyName: "AndesSoft Solutions",
  position: "Desarrollador Backend Junior",
  startDate: "2024-01-01",
  endDate: "2026-10-01",
  isCurrent: false,
  description: "Servicios REST con Java",
};

const EDUCATION: CvExtractedEducation = {
  institution: "Universidad Mayor de San Simón (UMSS)",
  degree: "Ingeniería de Sistemas",
  startDate: "2018-02-01",
  endDate: "2023-12-01",
  description: null,
};

const EDUCATION_RECORD: CvExistingEducation = {
  id: "22222222-2222-4222-8222-222222222222",
  institution: "Universidad Mayor de San Simón (UMSS)",
  degree: "Ingeniería de Sistemas",
  startDate: "2018-02-01",
  endDate: "2023-12-01",
  description: "Tesis sobre redes",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: { firstName: null, lastName: null, email: null, phone: null, location: null, cityId: null },
  presentation: { headline: null, aboutMe: null },
  educations: [EDUCATION],
  workExperiences: [EXPERIENCE],
  skills: [],
};

describe("normalizeCvMatchText", () => {
  it("ignores case, accents and extra spaces", () => {
    expect(normalizeCvMatchText("  Ingeniería   de SISTEMAS ")).toBe("ingenieria de sistemas");
    expect(normalizeCvMatchText(null)).toBe("");
  });
});

describe("toCvMatchKey", () => {
  it("builds the same key for equivalent texts", () => {
    expect(toCvMatchKey("AndesSoft", "Desarrollador")).toBe(toCvMatchKey(" andessoft ", "DESARROLLADOR"));
    expect(toCvMatchKey("AndesSoft", "Desarrollador")).not.toBe(toCvMatchKey("AndesSoft", "Analista"));
  });

  it("returns no key when every part is empty", () => {
    expect(toCvMatchKey(null, "  ")).toBeNull();
  });
});

type TestItem = { key: string | null; startDate: string | null };
type TestRecord = { id: string; key: string; startDate: string };

describe("matchCvRecords", () => {
  const matcher: CvRecordMatcher<TestItem, TestRecord> = {
    toExtractedKey: (item) => item.key,
    toRecordKey: (record) => record.key,
    getExtractedStartDate: (item) => item.startDate,
    isChanged: (item, record) => item.startDate !== record.startDate,
  };
  const noItems: TestItem[] | null = null;
  const noRecords: TestRecord[] | undefined = undefined;

  it("prefers the record that starts in the same month and pairs every record only once", () => {
    const records = [
      { id: "old", key: "a", startDate: "2020-05-01" },
      { id: "recent", key: "a", startDate: "2024-01-01" },
    ];

    const matches = matchCvRecords(
      [
        { key: "a", startDate: "2020-05-15" },
        { key: "a", startDate: "2024-01-01" },
        { key: "a", startDate: "2025-01-01" },
      ],
      records,
      matcher,
    );

    expect(matches).toEqual([
      { status: "changed", record: records[0] },
      { status: "same", record: records[1] },
      { status: "new" },
    ]);
  });

  it("prefers the record with the exact start date over another one of the same month", () => {
    const records = [
      { id: "edited", key: "a", startDate: "2018-02-15" },
      { id: "original", key: "a", startDate: "2018-02-01" },
    ];

    expect(matchCvRecords([{ key: "a", startDate: "2018-02-01" }], records, matcher)).toEqual([
      { status: "same", record: records[1] },
    ]);
  });

  it("treats records with incompatible dates or without start dates as new", () => {
    const records = [
      { id: "old", key: "a", startDate: "2019-01-01" },
      { id: "recent", key: "a", startDate: "2022-01-01" },
    ];

    const items: TestItem[] = [
      { key: "a", startDate: null },
      { key: "a", startDate: "2025-01-01" },
    ];

    expect(matchCvRecords(items, records, matcher)).toEqual([
      { status: "new" },
      { status: "new" },
    ]);
  });

  it("treats items without a key or without data as new", () => {
    const withoutKey: TestItem[] = [{ key: null, startDate: "2020-01-01" }];
    const withoutDate: TestItem[] = [{ key: "a", startDate: null }];

    expect(matchCvRecords(withoutKey, [{ id: "x", key: "a", startDate: "2020-01-01" }], matcher)).toEqual([{ status: "new" }]);
    expect(matchCvRecords(noItems, noRecords, matcher)).toEqual([]);
    expect(matchCvRecords(withoutDate, noRecords, matcher)).toEqual([{ status: "new" }]);
  });
});

describe("mergeCvWorkExperience", () => {
  it("keeps the saved names and fills empty extracted values with the saved ones", () => {
    expect(
      mergeCvWorkExperience(
        { ...EXPERIENCE, companyName: "andessoft solutions", startDate: null, endDate: null, description: "  " },
        { ...EXPERIENCE_RECORD, isCurrent: true, endDate: null },
      ),
    ).toEqual({
      companyName: "AndesSoft Solutions",
      position: "Desarrollador Backend Junior",
      startDate: "2024-01-01",
      endDate: null,
      isCurrent: true,
      description: "Servicios REST con Java",
    });
  });

  it("takes the extracted dates and description when they are present", () => {
    expect(
      mergeCvWorkExperience(
        { ...EXPERIENCE, startDate: "2024-02-01", isCurrent: true, endDate: null, description: " Nuevo detalle " },
        EXPERIENCE_RECORD,
      ),
    ).toEqual(
      expect.objectContaining({ startDate: "2024-02-01", endDate: null, isCurrent: true, description: "Nuevo detalle" }),
    );
    expect(mergeCvWorkExperience({ ...EXPERIENCE, endDate: "2026-11-01" }, EXPERIENCE_RECORD)).toEqual(
      expect.objectContaining({ endDate: "2026-11-01", isCurrent: false }),
    );
  });
});

describe("mergeCvEducation", () => {
  it("keeps the saved description when the extracted one is empty", () => {
    expect(mergeCvEducation({ ...EDUCATION, startDate: "2018-02-15" }, EDUCATION_RECORD)).toEqual({
      institution: "Universidad Mayor de San Simón (UMSS)",
      degree: "Ingeniería de Sistemas",
      startDate: "2018-02-15",
      endDate: "2023-12-01",
      description: "Tesis sobre redes",
    });
  });

  it("omits the end date when neither the cv nor the profile have one", () => {
    const merged = mergeCvEducation(
      { ...EDUCATION, startDate: null, endDate: null, description: " Mención " },
      { ...EDUCATION_RECORD, endDate: null },
    );

    expect(merged).toEqual(expect.objectContaining({ startDate: "2018-02-01", description: "Mención" }));
    expect(merged).not.toHaveProperty("endDate");
  });
});

describe("matchCvExtractionRecords", () => {
  it("marks identical records as same and records with new data as changed", () => {
    const matches = matchCvExtractionRecords(
      { ...EXTRACTION, educations: [{ ...EDUCATION, startDate: "2018-02-15" }] },
      { workExperiences: [EXPERIENCE_RECORD], educations: [EDUCATION_RECORD] },
    );

    expect(matches.experience).toEqual([{ status: "same", record: EXPERIENCE_RECORD }]);
    expect(matches.education).toEqual([{ status: "changed", record: EDUCATION_RECORD }]);
  });

  it("detects changes in the end date, the current flag and the description", () => {
    const changed = (experience: CvExtractedWorkExperience) =>
      matchCvExtractionRecords(
        { ...EXTRACTION, workExperiences: [experience] },
        { workExperiences: [EXPERIENCE_RECORD], educations: [] },
      ).experience[0].status;

    expect(changed({ ...EXPERIENCE, endDate: "2026-11-01" })).toBe("changed");
    expect(changed({ ...EXPERIENCE, isCurrent: true, endDate: null })).toBe("changed");
    expect(changed({ ...EXPERIENCE, description: "Otro detalle" })).toBe("changed");
    expect(changed({ ...EXPERIENCE, description: null })).toBe("same");
  });

  it("detects changes in the education end date and description", () => {
    const changed = (education: CvExtractedEducation) =>
      matchCvExtractionRecords(
        { ...EXTRACTION, educations: [education] },
        { workExperiences: [], educations: [EDUCATION_RECORD] },
      ).education[0].status;

    expect(changed({ ...EDUCATION, endDate: "2024-01-01" })).toBe("changed");
    expect(changed({ ...EDUCATION, description: "Otra" })).toBe("changed");
    expect(changed({ ...EDUCATION, endDate: null })).toBe("same");
  });

  it("creates everything when the profile has no records", () => {
    expect(matchCvExtractionRecords(EXTRACTION, { workExperiences: [], educations: [] })).toEqual({
      education: [{ status: "new" }],
      experience: [{ status: "new" }],
    });
  });

  it("matches educations whose names resolve to the same catalog entry", () => {
    const resolver = createCvEducationNamesResolver(
      [{ name: "Universidad Mayor de San Simón (UMSS)", aliases: ["UMSS", "Universidad Mayor de San Simón"] }],
      [
        {
          institution: "Universidad Mayor de San Simón (UMSS)",
          sources: [],
          degrees: [{ name: "Ingeniería de Sistemas", aliases: ["Ing. de Sistemas"] }],
        },
      ],
    );

    const matches = matchCvExtractionRecords(
      { ...EXTRACTION, educations: [{ ...EDUCATION, institution: "UMSS", degree: "Ing. de Sistemas" }] },
      { workExperiences: [], educations: [EDUCATION_RECORD] },
      resolver,
    );

    expect(matches.education).toEqual([{ status: "same", record: EDUCATION_RECORD }]);
  });
});

describe("createCvEducationNamesResolver", () => {
  it("keeps the names when the catalogs are not loaded", () => {
    expect(createCvEducationNamesResolver(null, undefined)({ institution: "UMSS", degree: "Sistemas" })).toEqual({
      institution: "UMSS",
      degree: "Sistemas",
    });
  });
});
