import { isApiError } from "@/shared/services/api-client";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { updateBusinessRecord } from "@/shared/services/storage/business-record-storage";
import { BusinessRecordStorageError } from "@/shared/services/storage/business-record-storage-error";
import { readSessionStorage, removeSessionStorage } from "@/shared/services/storage/browser-session-storage";
import type { MentorIntakePreferences } from "../types/mentor-intake-preferences.types";
import type { MentorIntakeIntention } from "../types/mentor-intake-intention.types";
import type { MentorIntakeOperation } from "../types/mentor-intake-operation.types";
import type { LegacyMentorIntakeIntention } from "../types/legacy-mentor-intake-intention.types";

function currentSubject(): string {
  try {
    const payload = getAccessToken()?.split(".")[1];
    if (!payload) return "anonymous";
    const subject: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).sub;
    return typeof subject === "string" ? subject : "anonymous";
  } catch { return "anonymous"; }
}

function storageKey(operation: MentorIntakeOperation): string {
  return `hu7:intake:${currentSubject()}:${operation}`;
}

function legacyIntention(operation: MentorIntakeOperation): MentorIntakeIntention | null {
  try {
    const value: unknown = JSON.parse(readSessionStorage(`hu7:intake:${operation}`) ?? "null");
    const saved = value as Partial<LegacyMentorIntakeIntention> | null;
    return saved?.subject === currentSubject() && typeof saved.fingerprint === "string" && typeof saved.key === "string" ? { fingerprint: saved.fingerprint, key: saved.key } : null;
  } catch { return null; }
}

function clearLegacyIntention(operation: MentorIntakeOperation): void {
  if (legacyIntention(operation)) removeSessionStorage(`hu7:intake:${operation}`);
}

export async function clearMentorIntakeIntentions(operations: readonly MentorIntakeOperation[] = ["activate", "request"]): Promise<void> {
  await Promise.all(operations.map((operation) => updateBusinessRecord(storageKey(operation), () => null)));
  for (const operation of operations) clearLegacyIntention(operation);
}

export async function withMentorIntakeKey<T>(operation: MentorIntakeOperation, preferences: MentorIntakePreferences, submit: (key: string) => Promise<T>): Promise<T> {
  const name = storageKey(operation);
  const fingerprint = JSON.stringify({ technicalAreaIds: [...preferences.technicalAreaIds].sort(), orientationTypeIds: [...preferences.orientationTypeIds].sort() });
  const legacy = legacyIntention(operation);
  const intention = await updateBusinessRecord<MentorIntakeIntention>(name, (stored) => {
    const saved = stored ?? legacy;
    return {
    fingerprint,
    key: saved?.fingerprint === fingerprint && typeof saved.key === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.key)
      ? saved.key : crypto.randomUUID(),
    };
  });
  const key = intention!.key;
  const clear = async () => {
    await updateBusinessRecord<MentorIntakeIntention>(name, (saved) => saved?.key === key ? null : saved);
    clearLegacyIntention(operation);
  };
  let result: T;
  try {
    result = await submit(key);
  } catch (error) {
    if (isApiError(error) && error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 408) await clear();
    throw error;
  }
  try {
    await clear();
  } catch (cause) {
    throw new BusinessRecordStorageError(cause, "El servidor confirmó la operación, pero no se pudo actualizar su clave guardada. Habilita el almacenamiento del navegador y consulta Mi participación antes de volver a solicitar.");
  }
  return result;
}
