import { describe, expect, it } from "vitest";
import { getDocumentCorrectionToken, isDocumentCorrectionToken, removeDocumentCorrectionToken } from "./document-correction-link";

const TOKEN = `dcr1.${"x".repeat(43)}`;

describe("Permiso de corrección del enlace", () => {
  it("lee el permiso del fragmento sin mezclarlo con el código SOL", () => {
    expect(getDocumentCorrectionToken(`#correctionToken=${TOKEN}`)).toBe(TOKEN);
    expect(getDocumentCorrectionToken(`#other=1&correctionToken=${encodeURIComponent(TOKEN)}`)).toBe(TOKEN);
  });

  it.each(["", TOKEN, `?correctionToken=${TOKEN}`, "#code=SOL-2026-0001", "#correctionToken=", "#correctionToken=session.jwt", `#correctionToken=${TOKEN}&correctionToken=${TOKEN}`, `#correctionToken=%20${TOKEN}`])(
    "no habilita la corrección con un fragmento ausente, ambiguo o inválido: %s", (fragment) => {
      expect(getDocumentCorrectionToken(fragment)).toBeNull();
    },
  );

  it.each([undefined, null, 1, {}, "", `${TOKEN}\n`, "dcr1.short"])("rechaza permisos inválidos: %j", (token) => {
    expect(isDocumentCorrectionToken(token)).toBe(false);
  });

  it("retira únicamente el permiso confirmado y conserva otros datos del fragmento", () => {
    expect(removeDocumentCorrectionToken(`#correctionToken=${TOKEN}`)).toBe("");
    expect(removeDocumentCorrectionToken(`#other=value&correctionToken=${TOKEN}`)).toBe("#other=value");
  });
});
