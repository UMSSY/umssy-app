import { describe, expect, it } from "vitest";
import { getCurrentCompany } from "./get-current-company";

describe("getCurrentCompany", () => {
  it("uses the company supplied by the authenticated session", () => {
    expect(
      getCurrentCompany({ id: "company-2", name: "NovaSoft Bolivia" }),
    ).toEqual({ id: "company-2", name: "NovaSoft Bolivia", initials: "NS" });
  });
  it("does not invent a company when no relationship exists", () => {
    expect(getCurrentCompany().id).toBeNull();
  });
  it("derives initials from lowercase names", () => {
    expect(getCurrentCompany({ id: "company-1", name: "acme" }).initials).toBe(
      "AC",
    );
  });
});
