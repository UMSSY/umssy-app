import { describe, expect, it } from "vitest";
import {
  getCompanyCorrectionToken,
  isCompanyCorrectionToken,
  removeCompanyCorrectionToken,
} from "./company-correction-token";

const TOKEN = `ccr1.${"x".repeat(43)}`;

describe("company correction token", () => {
  it("reconoce solo permisos ccr1 con 43 caracteres", () => {
    expect(isCompanyCorrectionToken(TOKEN)).toBe(true);
    expect(isCompanyCorrectionToken(`dcr1.${"x".repeat(43)}`)).toBe(false);
    expect(isCompanyCorrectionToken(`ccr1.${"x".repeat(42)}`)).toBe(false);
    expect(isCompanyCorrectionToken(`${TOKEN}\n`)).toBe(false);
    expect(isCompanyCorrectionToken(undefined)).toBe(false);
  });

  it("lee el permiso del fragmento", () => {
    expect(getCompanyCorrectionToken(`#token=${TOKEN}`)).toBe(TOKEN);
    expect(getCompanyCorrectionToken(`#a=1&token=${TOKEN}`)).toBe(TOKEN);
  });

  it.each(["", "token", `#correctionToken=${TOKEN}`, "#token=corto", `#token=${TOKEN}&token=${TOKEN}`])(
    "no lee un permiso de %j",
    (fragment) => {
      expect(getCompanyCorrectionToken(fragment)).toBeNull();
    },
  );

  it("quita el permiso y conserva el resto del fragmento", () => {
    expect(removeCompanyCorrectionToken(`#token=${TOKEN}`)).toBe("");
    expect(removeCompanyCorrectionToken(`#a=1&token=${TOKEN}`)).toBe("#a=1");
    expect(removeCompanyCorrectionToken(`token=${TOKEN}`)).toBe("");
  });
});
