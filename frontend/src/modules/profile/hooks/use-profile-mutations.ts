"use client";

import { useState } from "react";
import { profileService } from "../services/profile.service";
import type {
  PersonalInfoValues,
  PresentationValues,
  UserProfile,
} from "../types/profile.types";

export type ProfileMutation =
  | "personal-info"
  | "presentation"
  | "upload-photo"
  | "remove-photo";

export interface UseProfileMutationsResult {
  pendingMutation: ProfileMutation | null;
  savePersonalInfo: (values: PersonalInfoValues) => Promise<UserProfile>;
  savePresentation: (values: PresentationValues) => Promise<UserProfile>;
  uploadPhoto: (file: File) => Promise<UserProfile>;
  removePhoto: () => Promise<UserProfile>;
}

export function useProfileMutations(): UseProfileMutationsResult {
  const [pendingMutation, setPendingMutation] = useState<ProfileMutation | null>(null);

  const run = async (
    mutation: ProfileMutation,
    request: () => Promise<UserProfile>,
  ): Promise<UserProfile> => {
    setPendingMutation(mutation);
    try {
      return await request();
    } finally {
      setPendingMutation(null);
    }
  };

  return {
    pendingMutation,
    savePersonalInfo: (values) =>
      run("personal-info", () => profileService.updatePersonalInfo(values)),
    savePresentation: (values) =>
      run("presentation", () => profileService.updatePresentation(values)),
    uploadPhoto: (file) => run("upload-photo", () => profileService.uploadPhoto(file)),
    removePhoto: () => run("remove-photo", () => profileService.removePhoto()),
  };
}
