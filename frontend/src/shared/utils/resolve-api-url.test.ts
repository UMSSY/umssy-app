import { describe, expect, it, vi } from "vitest";
import { resolveApiUrl } from "./resolve-api-url";

vi.mock("@/shared/config/env.config", () => ({
  ENV_CONFIG: { apiUrl: "http://localhost:8080/api/" },
}));

describe("resolveApiUrl", () => {
  it("joins an API path with the configured API URL", () => {
    expect(resolveApiUrl("/companies/company-1/logo")).toBe("http://localhost:8080/api/companies/company-1/logo");
  });

  it("keeps null when there is no path", () => {
    expect(resolveApiUrl(null)).toBeNull();
  });
});
