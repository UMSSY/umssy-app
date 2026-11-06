import type { Epic2Skill } from "./epic2-skill.types";

export interface Epic2RadarSource {
  userId: string;
  status: "ready" | "pending" | "error";
  version: number;
  updatedAt: string | null;
  dictionaryVersion: string | null;
  skills: Epic2Skill[];
}
