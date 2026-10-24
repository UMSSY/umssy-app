
import { describe, expect, it } from "vitest";
import {
  parseMentorDirectoryState,
  updateMentorDirectoryParams,
} from "./mentor-directory-navigation";

describe("parseMentorDirectoryState", () => {
  it("usa los valores predeterminados", () => {
    expect(parseMentorDirectoryState(new URLSearchParams())).toEqual({
      page: 1,
      search: "",
      area: "",
      available: false,
      sort: "name_asc",
    });
  });

  it("lee los parámetros de la URL", () => {
    const params = new URLSearchParams(
      "page=2&search=hugo&area=Backend&available=true&sort=affinity",
    );

    expect(parseMentorDirectoryState(params)).toEqual({
      page: 2,
      search: "hugo",
      area: "Backend",
      available: true,
      sort: "affinity",
    });
  });

  it("corrige páginas inválidas", () => {
    const params = new URLSearchParams("page=abc");

    expect(parseMentorDirectoryState(params).page).toBe(1);
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
      "page=2&search=hugo&area=Backend&available=true",
    );

    const next = updateMentorDirectoryParams(current, {
      search: "",
      area: "",
      available: false,
    });

    expect(next.get("page")).toBe("1");
    expect(next.has("search")).toBe(false);
    expect(next.has("area")).toBe(false);
    expect(next.has("available")).toBe(false);
  });

  it("conserva todos los filtros al actualizar sin cambios", () => {
    const current = new URLSearchParams(
      "page=2&search=hugo&area=Backend&available=true&sort=affinity",
    );

    const next = updateMentorDirectoryParams(current, {});

    expect(next.get("page")).toBe("2");
    expect(next.get("search")).toBe("hugo");
    expect(next.get("area")).toBe("Backend");
    expect(next.get("available")).toBe("true");
    expect(next.get("sort")).toBe("affinity");
  });
});
