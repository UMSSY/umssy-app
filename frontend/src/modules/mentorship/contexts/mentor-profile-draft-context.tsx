"use client";

import { createContext } from "react";
import { useMentorProfileDraftState } from "../hooks/use-mentor-profile-draft-state";
import type { MentorProfileDraftProviderProps } from "../types/mentor-profile-draft-provider-props.types";
import type { MentorProfileDraftValue } from "../types/mentor-profile-draft-value.types";

export const MentorProfileDraftContext = createContext<MentorProfileDraftValue | null>(null);

export function MentorProfileDraftProvider({ children }: MentorProfileDraftProviderProps) {
  const value = useMentorProfileDraftState();
  return (
    <MentorProfileDraftContext.Provider value={value}>
      {children}
    </MentorProfileDraftContext.Provider>
  );
}