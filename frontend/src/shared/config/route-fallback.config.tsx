import type { ReactNode } from "react";
import { MentorAccessFallback } from "@/modules/mentors";

export const APP_ROUTE_FALLBACKS: Readonly<Record<string, ReactNode>> = {
  "/mentors/participation/technical-areas": <MentorAccessFallback />,
};
