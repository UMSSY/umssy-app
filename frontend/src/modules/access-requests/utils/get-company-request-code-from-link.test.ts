import { describe, expect, it } from "vitest";
import { getCompanyRequestCodeFromLink } from "./get-company-request-code-from-link";

describe("getCompanyRequestCodeFromLink", () => {
  it("acepta códigos EMP y los normaliza", () => {
    expect(getCompanyRequestCodeFromLink(" emp-2026-0001 ")).toBe("EMP-2026-0001");
    expect(getCompanyRequestCodeFromLink("EMP-2026-12345")).toBe("EMP-2026-12345");
  });

  it.each([undefined, null, "", "SOL-2026-0001", "EMP-26-0001", "EMP-2026-1", ["EMP-2026-0001"], "EMP-2026-0001/x"])(
    "rechaza %j",
    (value) => {
      expect(getCompanyRequestCodeFromLink(value as string | string[] | null | undefined)).toBeNull();
    },
  );
});
