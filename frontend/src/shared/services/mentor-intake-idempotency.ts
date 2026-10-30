import { isApiError } from "@/shared/services/api-client";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { updateIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import {
  readSessionStorage,
  removeSessionStorage,
} from "@/shared/services/storage/browser-session-storage";
import type { MentorIntakePreferences } from "@/shared/types/mentor-intake-preferences.types";
import type { MentorIntakeIntention } from "@/shared/types/mentor-intake-intention.types";
import type { MentorIntakeOperation } from "@/shared/types/mentor-intake-operation.types";
import type { LegacyMentorIntakeIntention } from "@/shared/types/legacy-mentor-intake-intention.types";

function currentSubject(): string {
  try {
    const payload = getAccessToken()?.split(".")[1];
    if (!payload) return "anonymous";
    const subject: unknown = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ).sub;
    return typeof subject === "string" ? subject : "anonymous";
  } catch {
    return "anonymous";
  }
}

function storageKey(operation: MentorIntakeOperation): string {
  return `hu7:intake:${currentSubject()}:${operation}`;
}

function legacyIntention(
  operation: MentorIntakeOperation,
): MentorIntakeIntention | null {
  try {
    const value: unknown = JSON.parse(
      readSessionStorage(`hu7:intake:${operation}`) ?? "null",
    );
    const saved = value as Partial<LegacyMentorIntakeIntention> | null;
    return saved?.subject === currentSubject() &&
      typeof saved.fingerprint === "string" &&
      typeof saved.key === "string"
      ? { fingerprint: saved.fingerprint, key: saved.key }
      : null;
  } catch {
    return null;
  }
}

function clearLegacyIntention(operation: MentorIntakeOperation): void {
  if (legacyIntention(operation))
    removeSessionStorage(`hu7:intake:${operation}`);
}

export async function clearMentorIntakeIntentions(
  operations: readonly MentorIntakeOperation[] = ["activate", "request"],
): Promise<void> {
  for (const operation of operations) clearLegacyIntention(operation);
  await Promise.all(
    operations.map((operation) =>
      updateIndexedDb(storageKey(operation), () => null),
    ),
  );
}

export async function withMentorIntakeKey<T>(
  operation: MentorIntakeOperation,
  preferences: MentorIntakePreferences,
  submit: (key: string) => Promise<T>,
): Promise<T> {
  const name = storageKey(operation);
  const fingerprint = JSON.stringify({
    technicalAreaIds: [...preferences.technicalAreaIds].sort(),
    orientationTypeIds: [...preferences.orientationTypeIds].sort(),
  });
  const legacy = legacyIntention(operation);
  const intention = await updateIndexedDb<MentorIntakeIntention>(
    name,
    (stored) => {
      const saved = stored ?? legacy;
      return {
        fingerprint,
        key:
          saved?.fingerprint === fingerprint &&
          typeof saved.key === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            saved.key,
          )
            ? saved.key
            : crypto.randomUUID(),
      };
    },
  );
  const key = intention!.key;
  const clear = () => {
    clearLegacyIntention(operation);
    return updateIndexedDb<MentorIntakeIntention>(name, (saved) =>
      saved?.key === key ? null : saved,
    );
  };
  try {
    const result = await submit(key);
    await clear();
    return result;
  } catch (error) {
    if (isApiError(error) && error.response && error.response.status < 500)
      await clear();
    throw error;
  }
}
