
import { describe, expect, it } from "vitest";
import {
  normalizeMentorDirectoryParams,
  parseMentorDirectoryState,
  updateMentorDirectoryParams,
} from "./mentor-directory-navigation";

describe("parseMentorDirectoryState", () => {
  it("usa los valores predeterminados", () => {
    expect(parseMentorDirectoryState(new URLSearchParams())).toEqual({
      page: 1,
      search: "",
      area: "",
      orientation: "",
      available: false,
      sort: "name_asc",
    });
  });

  it("lee los parámetros de la URL", () => {
    const params = new URLSearchParams(
      "page=2&search=hugo&area=Backend&orientation=Orientaci%C3%B3n%20t%C3%A9cnica&available=false&sort=affinity",
    );

    expect(parseMentorDirectoryState(params)).toEqual({
      page: 2,
      search: "hugo",
      area: "Backend",
      orientation: "Orientación técnica",
      available: false,
      sort: "affinity",
    });
  });

  it("corrige páginas inválidas", () => {
    for (const value of ["abc", "0", "-2", "2.5", "01", "1e2", "9007199254740992"]) {
      expect(parseMentorDirectoryState(new URLSearchParams(`page=${value}`)).page).toBe(1);
    }
  });

  it("normaliza parámetros propios sin alterar los ajenos", () => {
    const params = new URLSearchParams("page=02&sort=unknown&available=yes&module=chat");
    expect(normalizeMentorDirectoryParams(params).toString())
      .toBe("page=1&sort=name_asc&available=false&module=chat");
  });

  it("ajusta la página fuera de rango cuando se conoce totalPages", () => {
    expect(normalizeMentorDirectoryParams(new URLSearchParams("page=9&sort=affinity"), 3).get("page"))
      .toBe("3");
    expect(normalizeMentorDirectoryParams(new URLSearchParams("page=9"), 0).get("page"))
      .toBe("1");
  });
});

describe("updateMentorDirectoryParams", () => {
  it("conserva parámetros ajenos al directorio", () => {
    const current = new URLSearchParams("page=2&module=chat");

    const next = updateMentorDirectoryParams(current, { page: 3 });

    expect(next.get("page")).toBe("3");
    expect(next.get("module")).toBe("chat");
  });

  it("reinicia la página al cambiar un filtro", () => {
    const current = new URLSearchParams("page=3&area=Backend");

    const next = updateMentorDirectoryParams(current, {
      area: "Frontend",
    });

    expect(next.get("page")).toBe("1");
    expect(next.get("area")).toBe("Frontend");
  });

  it("elimina filtros vacíos", () => {
    const current = new URLSearchParams(
      "page=2&search=hugo&area=Backend&orientation=Orientaci%C3%B3n%20t%C3%A9cnica&available=true",
    );

    const next = updateMentorDirectoryParams(current, {
      search: "",
      area: "",
      orientation: "",
      available: false,
    });

    expect(next.get("page")).toBe("1");
    expect(next.has("search")).toBe(false);
    expect(next.has("area")).toBe(false);
    expect(next.has("orientation")).toBe(false);
    expect(next.has("available")).toBe(false);
  });

  it("conserva todos los filtros al actualizar sin cambios", () => {
    const current = new URLSearchParams(
      "page=2&search=hugo&area=Backend&available=false&sort=affinity",
    );

    const next = updateMentorDirectoryParams(current, {});

    expect(next.get("page")).toBe("2");
    expect(next.get("search")).toBe("hugo");
    expect(next.get("area")).toBe("Backend");
    expect(next.get("available")).toBe("false");
    expect(next.get("sort")).toBe("affinity");
  });
});
