"use client";

import { useState } from "react";
import { authService } from "../services/auth.service";
import type { LoginPayload, LoginResponse } from "../types/auth-types";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(payload: LoginPayload): Promise<LoginResponse | null> {
    setIsLoading(true);
    setError(null);
    try {
      return await authService.login(payload);
    } catch {
      setError("Correo o contraseña incorrectos, o el rol elegido no corresponde a tu cuenta.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}