import { describe, expect, it } from "vitest";
import { RADAR_AXIS_NAMES } from "@/modules/radar-chart";
import { resolveRadarMentorAreas } from "./radar-mentor-area";

describe("Correspondencia con el catálogo de mentorías", () => {
  it.each(RADAR_AXIS_NAMES)("resuelve $name con el ID entregado por la API", axis => {
    const record = { id: "id-real-del-catalogo", name: axis.name, description: null };
    expect(resolveRadarMentorAreas(axis.id, [record])).toEqual([record]);
    expect(resolveRadarMentorAreas(axis.id, [])).toEqual([]);
  });
  it.each([
    ["desarrollo", "Desarrollo de Software"],
    ["data-ai", "Datos & IA"],
    ["qa", "QA & Testing"],
  ] as const)("resuelve %s con %s", (axis, name) => {
    const id = "ee0d0fe2-bc99-4a6a-8939-2bd663c3cae1";
    expect(resolveRadarMentorAreas(axis, [{ id, name, description: null }]).map(area => area.id)).toEqual([id]);
  });

  it("usa los nombres del catálogo existente sin sustituir áreas ajenas", () => {
    const catalog = ["Cloud", "Datos", "Backend", "Desarrollo Web", "QA", "Redes", "Arquitectura"].map(name => ({ id: `catalog-${name}`, name, description: null }));
    expect(resolveRadarMentorAreas("cloud-devops", catalog).map(area => area.name)).toEqual(["Cloud"]);
    expect(resolveRadarMentorAreas("data-ai", catalog).map(area => area.name)).toEqual(["Datos"]);
    expect(resolveRadarMentorAreas("desarrollo", catalog).map(area => area.id)).toEqual(["catalog-Desarrollo Web", "catalog-Backend"]);
    expect(resolveRadarMentorAreas("ciberseguridad", catalog)).toEqual([]);
    expect(resolveRadarMentorAreas("gobernanza-ti", catalog)).toEqual([]);
  });
});
