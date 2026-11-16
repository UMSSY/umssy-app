import { describe, expect, it } from "vitest";
import { parseCompaniesResponse } from "./company-response";

describe("parseCompaniesResponse", () => {
  it("accepts a plain array and turns a null logo into undefined", () => {
    const result = parseCompaniesResponse([
      { id: "a1", name: "Tecnosoft", description: "Software", logoUrl: null, activeVacanciesCount: 2 },
    ]);
    expect(result).toEqual([
      { id: "a1", name: "Tecnosoft", description: "Software", logoUrl: undefined, activeVacanciesCount: 2 },
    ]);
  });

  it("accepts a { data } envelope and numeric ids", () => {
    const result = parseCompaniesResponse({
      data: [{ id: 7, name: "Andes", description: null, logoUrl: "/logo.png", activeVacanciesCount: 1 }],
    });
    expect(result[0]).toMatchObject({ id: "7", description: "", logoUrl: "/logo.png" });
  });

  it("rejects malformed payloads", () => {
    expect(() => parseCompaniesResponse({ foo: 1 })).toThrow();
    expect(() => parseCompaniesResponse([{ id: "1", name: "X", activeVacanciesCount: -1 }])).toThrow();
  });
});