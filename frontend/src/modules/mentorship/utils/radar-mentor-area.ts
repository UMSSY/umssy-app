import type { AreaId } from "@/modules/radar-chart/types/area-id.types";
import type { TechnicalAreaResponse } from "../types/technical-area-response.types";

// Resolve against the live catalog; never fabricate UUIDs or substitute unrelated specialties.
const CATALOG_NAMES: Record<AreaId, readonly string[]> = {
  desarrollo: ["Desarrollo", "Desarrollo de Software", "Desarrollo Web", "Backend"],
  "cloud-devops": ["Cloud/DevOps", "Cloud & DevOps", "Cloud", "DevOps"],
  "data-ai": ["Data/AI", "Datos & IA", "Datos e IA", "Datos"],
  qa: ["QA", "QA & Testing"],
  ciberseguridad: ["Ciberseguridad", "Seguridad"],
  "gobernanza-ti": ["Gobernanza TI", "Gobernanza de TI"],
};

export function resolveRadarMentorArea(id: AreaId, catalog: readonly TechnicalAreaResponse[]) {
  return CATALOG_NAMES[id]?.flatMap(name => catalog.filter(area => area.name === name))[0];
}
