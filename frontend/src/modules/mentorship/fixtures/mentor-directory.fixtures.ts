import { MENTOR_PROFILES } from "./mentor-profiles.fixtures";
import type { MentorDirectoryItem } from "../types/mentor-directory.types";

export const MENTOR_DIRECTORY_FIXTURES: MentorDirectoryItem[] = MENTOR_PROFILES.map((mentor) => ({
  id: String(mentor.id),
  fullName: mentor.name,
  jobTitle: mentor.position || null,
  technicalAreas: mentor.technicalAreas,
  isAvailable: mentor.isAvailable,
}));
