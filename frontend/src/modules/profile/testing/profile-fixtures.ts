import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { CityOption, UserProfile } from "../types/profile.types";

export const CITIES: CityOption[] = [
  { id: "city-cbba", title: "Cochabamba" },
  { id: "city-lpz", title: "La Paz" },
];

export function buildProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    firstName: "Valeria",
    lastName: "Quispe",
    institutionalEmail: "valeria.quispe@est.umss.edu",
    personalEmail: "valeria@correo.com",
    phone: "+591 70000000",
    city: CITIES[0],
    headline: "Desarrolladora web junior",
    aboutMe: "Soy egresada de Ingeniería de Sistemas de la UMSS.",
    interestedOpportunities: "Desarrollo frontend",
    photoPath: null,
    updatedAt: "2026-09-20T10:00:00.000Z",
    ...overrides,
  };
}

export function buildEmptyProfile(): UserProfile {
  return buildProfile({
    personalEmail: null,
    phone: null,
    city: null,
    headline: null,
    aboutMe: null,
    interestedOpportunities: null,
  });
}

export function buildAxiosError(status: number | null, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  const response =
    status === null
      ? undefined
      : ({ status, statusText: "", headers: {}, config, data } as AxiosResponse);

  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response);
}
