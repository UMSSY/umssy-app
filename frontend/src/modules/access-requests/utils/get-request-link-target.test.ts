import { describe, expect, it } from "vitest";
import { getRequestLinkTarget } from "./get-request-link-target";

describe("getRequestLinkTarget", () => {
  it("distingue titulados y empresas por el prefijo del código", () => {
    expect(getRequestLinkTarget("SOL-2026-0001")).toEqual({ kind: "student", code: "SOL-2026-0001" });
    expect(getRequestLinkTarget("emp-2026-0002")).toEqual({ kind: "company", code: "EMP-2026-0002" });
  });

  it.each([undefined, null, "", "OTRO-2026-0001", ["EMP-2026-0001"], ["SOL-2026-0001", "EMP-2026-0001"]])(
    "devuelve null para %j",
    (value) => {
      expect(getRequestLinkTarget(value as string | string[] | null | undefined)).toBeNull();
    },
  );
});
