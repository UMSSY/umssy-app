import { describe, expect, it } from "vitest";
import { detectEmailTypo } from "./detect-email-typo";

describe("detectEmailTypo", () => {
  it.each([
    ["code0156@gma.con", "gma.com"],
    ["ana@umss.edu.b", "umss.edu.bo"],
  ])("corrige el dominio de primer nivel inventado de %s", (email, expected) => {
    expect(detectEmailTypo(email)).toBe(expected);
  });

  it.each([
    ["ana@gbail.com", "gmail.com"],
    ["ana@gmial.com", "gmail.com"],
    ["ana@hotmial.com", "hotmail.com"],
    ["ana@outlok.com", "outlook.com"],
  ])("corrige el nombre mal escrito de un proveedor conocido en %s", (email, expected) => {
    expect(detectEmailTypo(email)).toBe(expected);
  });

  it.each(["ana@gmail.com", "ana@umss.edu.bo", "ana@est.umss.edu.bo", "admin.1@umssy.test"])("acepta %s sin sugerir nada", (email) => {
    expect(detectEmailTypo(email)).toBeNull();
  });

  it("acepta un dominio desconocido que no se parece a ninguno conocido", () => {
    expect(detectEmailTypo("ana@miempresa.com.bo")).toBeNull();
    expect(detectEmailTypo("ana@cooperativa.coop")).toBeNull();
  });

  it("no confunde un dominio de primer nivel real con una errata de otro", () => {
    expect(detectEmailTypo("a.b+c@mail.co")).toBeNull();
    expect(detectEmailTypo("ana@empresa.om")).toBeNull();
  });
});
