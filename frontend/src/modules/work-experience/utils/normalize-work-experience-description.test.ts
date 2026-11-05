
import { describe, expect, it } from "vitest";
import { normalizeWorkExperienceDescription } from "./normalize-work-experience-description";

describe("normalizeWorkExperienceDescription", () => {
  it("converts uppercase text to lowercase", () => {
    expect(
      normalizeWorkExperienceDescription("DESARROLLO DE APLICACIONES"),
    ).toBe("desarrollo de aplicaciones");
  });

  it("preserves ñ and accented vowels", () => {
    expect(
      normalizeWorkExperienceDescription("DISEÑÉ APLICACIONES PARA EDUCACIÓN"),
    ).toBe("diseñé aplicaciones para educación");
  });

  it("removes punctuation and reduces multiple spaces", () => {
    expect(
      normalizeWorkExperienceDescription(
        "  Desarrollo,   de aplicaciones... con Python!  ",
      ),
    ).toBe("desarrollo de aplicaciones con python");
  });

  it("preserves null descriptions", () => {
    expect(normalizeWorkExperienceDescription(null)).toBeNull();
  });

  it("preserves technical names such as C++, C#, F#, Node.js and .NET", () => {
    expect(
      normalizeWorkExperienceDescription(
        "Trabajo con C++, C#, F#, Node.js y .NET",
      ),
    ).toBe("trabajo con c++ c# f# node.js y .net");
  });
});
