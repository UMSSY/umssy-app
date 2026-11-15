import { describe, expect, it } from "vitest";
import { RADAR_AXIS_NAMES } from "@/modules/radar-chart/constants/radar-axis-names.constants";
import { resolveRadarMentorArea } from "./radar-mentor-area";

describe("Correspondencia con el catálogo de mentorías", () => {
  it.each(RADAR_AXIS_NAMES)("resuelve $name con el ID entregado por la API", axis => {
    const record = { id: "id-real-del-catalogo", name: axis.name, description: null };
    expect(resolveRadarMentorArea(axis.id, [record])).toBe(record);
    expect(resolveRadarMentorArea(axis.id, [])).toBeUndefined();
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
