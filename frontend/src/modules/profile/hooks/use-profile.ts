"use client";

import { useEffect, useState } from "react";
import { profileService } from "../services/profile.service";
import { getApiErrorMessage } from "../utils/api-error";
import type { CityOption, UserProfile } from "../types/profile.types";

type ProfileStatus = "loading" | "success" | "error";

interface ProfileState {
  status: ProfileStatus;
  profile: UserProfile | null;
  cities: CityOption[];
  errorMessage: string | null;
}

export interface UseProfileResult extends ProfileState {
  reload: () => void;
  replaceProfile: (profile: UserProfile) => void;
}

const INITIAL_STATE: ProfileState = {
  status: "loading",
  profile: null,
  cities: [],
  errorMessage: null,
};

export function useProfile(): UseProfileResult {
  const [state, setState] = useState<ProfileState>(INITIAL_STATE);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    Promise.all([profileService.getMyProfile(), profileService.getCities()])
      .then(([profile, cities]) => {
        if (!isCancelled) {
          setState({ status: "success", profile, cities, errorMessage: null });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setState({
            ...INITIAL_STATE,
            status: "error",
            errorMessage: getApiErrorMessage(error, "No se pudo cargar tu perfil."),
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setState(INITIAL_STATE);
    setReloadKey((key) => key + 1);
  };

  const replaceProfile = (profile: UserProfile) => {
    setState((current) => ({ ...current, profile }));
  };

  return { ...state, reload, replaceProfile };
}
