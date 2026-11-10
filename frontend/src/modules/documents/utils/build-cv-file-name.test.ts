import { describe, expect, it } from "vitest";
import { buildCvFileName } from "./build-cv-file-name";

describe("buildCvFileName", () => {
  it("builds the name with the first and last name", () => {
    expect(buildCvFileName("Valeria", "Quispe")).toBe("CV_Valeria_Quispe.pdf");
  });

  it("joins compound names with underscores", () => {
    expect(buildCvFileName("  Juan Carlos ", "Via Orozco")).toBe("CV_Juan_Carlos_Via_Orozco.pdf");
  });

  it("removes accents and characters that are unsafe in a file name", () => {
    expect(buildCvFileName("José María", "Peña/Núñez")).toBe("CV_Jose_Maria_Pena_Nunez.pdf");
  });

  it("skips the part that is missing", () => {
    expect(buildCvFileName("Valeria", null)).toBe("CV_Valeria.pdf");
    expect(buildCvFileName(undefined, "Quispe")).toBe("CV_Quispe.pdf");
  });

  it("falls back to a generic name without names", () => {
    expect(buildCvFileName("", "   ")).toBe("CV.pdf");
  });
});
