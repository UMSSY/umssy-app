"use client";

import { useAuth } from "@/shared/contexts/auth-context";
import { getRouteRoles } from "@/shared/utils/get-route-roles";
import { SURVEY_ANSWER_PATH } from "../constants/survey-notifications.constants";

export function useCanAnswerSurveys(): boolean {
  const { roles } = useAuth();
  const allowedRoles = getRouteRoles(SURVEY_ANSWER_PATH);
  return roles.some((role) => allowedRoles.includes(role));
}
