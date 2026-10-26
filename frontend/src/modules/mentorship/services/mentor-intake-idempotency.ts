import { isApiError } from "@/shared/services/api-client";
import type { ParticipationPreferences } from "./mentor-participation.service";

type IntakeAction = "request" | "activate";
const name = (action: IntakeAction) => `hu7:intake:${action}`;

export async function withIntakeKey<T>(action: IntakeAction, preferences: ParticipationPreferences,
  submit: (key: string) => Promise<T>): Promise<T> {
  const fingerprint = JSON.stringify({ technicalAreaIds: [...preferences.technicalAreaIds].sort(),
    orientationTypeIds: [...preferences.orientationTypeIds].sort() });
  const storage = typeof window === "undefined" ? null : window.sessionStorage;
  let saved: { fingerprint: string; key: string } | null = null;
  try { saved = JSON.parse(storage?.getItem(name(action)) ?? "null"); } catch { saved = null; }
  const key = saved?.fingerprint === fingerprint ? saved.key : crypto.randomUUID();
  storage?.setItem(name(action), JSON.stringify({ fingerprint, key }));
  const clear = () => { if (storage?.getItem(name(action)) === JSON.stringify({ fingerprint, key })) storage.removeItem(name(action)); };
  try {
    const result = await submit(key);
    clear();
    return result;
  } catch (error) {
    // Con fallo de red o 5xx no sabemos si el servidor confirmó la operación.
    // Se conserva la clave para recuperar el resultado sin sumar otro intento.
    if (isApiError(error) && error.response && error.response.status < 500) clear();
    throw error;
  }
}
