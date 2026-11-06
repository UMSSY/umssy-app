"use client";

import { createContext, useContext } from "react";
import type { ProfileSurfaceProps } from "../types/profile-surface-props.types";

const ProfileSurfaceContext = createContext(false);

export function ProfileSurface({ children }: ProfileSurfaceProps) {
  return <ProfileSurfaceContext value><article aria-label="Resumen profesional" className="overflow-hidden rounded-lg border border-border bg-surface">{children}</article></ProfileSurfaceContext>;
}

export function useProfileSurface() {
  return useContext(ProfileSurfaceContext);
}
