import { describe, expect, it } from "vitest";
import { sanitizeExternalWebsiteUrl } from "./sanitize-external-website-url";

describe("sanitizeExternalWebsiteUrl", () => {
  it("devuelve null cuando no hay sitio web", () => {
    expect(sanitizeExternalWebsiteUrl(null)).toBeNull();
    expect(sanitizeExternalWebsiteUrl("   ")).toBeNull();
    expect(sanitizeExternalWebsiteUrl("#")).toBeNull();
  });

  it("agrega https cuando falta el protocolo", () => {
    expect(sanitizeExternalWebsiteUrl("techandina.bo")).toBe("https://techandina.bo/");
  });

  it("rechaza protocolos que no son web", () => {
    expect(sanitizeExternalWebsiteUrl("javascript:alert(1)")).toBeNull();
  });
});
