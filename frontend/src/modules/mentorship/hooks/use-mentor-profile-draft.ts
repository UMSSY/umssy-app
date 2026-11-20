"use client";

import { useContext } from "react";
import { MentorProfileDraftContext } from "../contexts/mentor-profile-draft-context";
import { useMentorProfileDraftState } from "./use-mentor-profile-draft-state";

export function useMentorProfileDraft() {
  const context = useContext(MentorProfileDraftContext);
  const fallback = useMentorProfileDraftState();
  return context ?? fallback;
}