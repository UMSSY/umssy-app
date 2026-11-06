import type { AreaId } from '../types/area-detail.types';

export const RADAR_AXIS_NAMES: ReadonlyArray<{ id: AreaId; name: string }> = [
  { id: "desarrollo", name: "Desarrollo" },
  { id: "cloud-devops", name: "Cloud/DevOps" },
  { id: "data-ai", name: "Data/AI" },
  { id: "qa", name: "QA" },
  { id: "ciberseguridad", name: "Ciberseguridad" },
  { id: "gobernanza-ti", name: "Gobernanza TI" },
];
