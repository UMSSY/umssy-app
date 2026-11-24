import { describe, expect, it } from "vitest";
import { RADAR_AXIS_NAMES } from "@/modules/radar-chart/constants/radar-axis-names.constants";
import { resolveRadarMentorArea } from "./radar-mentor-area";

describe("Correspondencia con el catálogo de mentorías", () => {
  it.each(RADAR_AXIS_NAMES)("resuelve $name con el ID entregado por la API", axis => {
    const record = { id: "id-real-del-catalogo", name: axis.name, description: null };
    expect(resolveRadarMentorArea(axis.id, [record])).toBe(record);
    expect(resolveRadarMentorArea(axis.id, [])).toBeUndefined();
  });
  it.each([
    ["desarrollo", "Desarrollo de Software"],
    ["data-ai", "Datos & IA"],
    ["qa", "QA & Testing"],
  ] as const)("resuelve %s con %s", (axis, name) => {
    const id = "ee0d0fe2-bc99-4a6a-8939-2bd663c3cae1";
    expect(resolveRadarMentorArea(axis, [{ id, name, description: null }])?.id).toBe(id);
  });

  it("usa los nombres del catálogo existente sin sustituir áreas ajenas", () => {
    const catalog = ["Cloud", "Datos", "Desarrollo Web", "QA", "Redes", "Arquitectura"].map(name => ({ id: `catalog-${name}`, name, description: null }));
    expect(resolveRadarMentorArea("cloud-devops", catalog)?.name).toBe("Cloud");
    expect(resolveRadarMentorArea("data-ai", catalog)?.name).toBe("Datos");
    expect(resolveRadarMentorArea("desarrollo", catalog)?.name).toBe("Desarrollo Web");
    expect(resolveRadarMentorArea("ciberseguridad", catalog)).toBeUndefined();
    expect(resolveRadarMentorArea("gobernanza-ti", catalog)).toBeUndefined();
  });
});
