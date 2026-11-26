import { isApiError } from "@/shared/services/api-client";
import { getAccessToken, initializeAccessTokenStorage } from "@/shared/services/storage/access-token-storage";
import {
  getCurrentSessionUserId,
  readCurrentSessionUserId,
} from "@/shared/services/storage/session-user-id-storage";
import { updateIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import {
  readSessionStorage,
  removeSessionStorage,
} from "@/shared/services/storage/browser-session-storage";
import type { MentorIntakePreferences } from "@/shared/types/mentor-intake-preferences.types";
import type { MentorIntakeIntention } from "@/shared/types/mentor-intake-intention.types";
import type { MentorIntakeOperation } from "@/shared/types/mentor-intake-operation.types";
import type { LegacyMentorIntakeIntention } from "@/shared/types/legacy-mentor-intake-intention.types";

async function currentSubject(): Promise<string> {
  try {
    const sessionUserId =
      getCurrentSessionUserId() ?? (await readCurrentSessionUserId());
    if (sessionUserId) return sessionUserId;

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

function storageKey(subject: string, operation: MentorIntakeOperation): string {
  return `hu7:intake:${subject}:${operation}`;
}

function legacyIntention(
  subject: string,
  operation: MentorIntakeOperation,
): MentorIntakeIntention | null {
  try {
    const value: unknown = JSON.parse(
      readSessionStorage(`hu7:intake:${operation}`) ?? "null",
    );
    const saved = value as Partial<LegacyMentorIntakeIntention> | null;
    return saved?.subject === subject &&
      typeof saved.fingerprint === "string" &&
      typeof saved.key === "string"
      ? { fingerprint: saved.fingerprint, key: saved.key }
      : null;
  } catch {
    return null;
  }
}

function clearLegacyIntention(
  subject: string,
  operation: MentorIntakeOperation,
): void {
  if (legacyIntention(subject, operation))
    removeSessionStorage(`hu7:intake:${operation}`);
}

export async function clearMentorIntakeIntentions(
  operations: readonly MentorIntakeOperation[] = ["activate", "request"],
): Promise<void> {
  const subject = await currentSubject();
  for (const operation of operations) clearLegacyIntention(subject, operation);
  await Promise.all(
    operations.map((operation) =>
      updateIndexedDb(storageKey(subject, operation), () => null),
    ),
  );
}

export async function withMentorIntakeKey<T>(
  operation: MentorIntakeOperation,
  preferences: MentorIntakePreferences,
  submit: (key: string) => Promise<T>,
): Promise<T> {
  await initializeAccessTokenStorage();
  const subject = await currentSubject();
  const name = storageKey(subject, operation);
  const fingerprint = JSON.stringify({
    technicalAreaIds: [...preferences.technicalAreaIds].sort(),
    orientationTypeIds: [...preferences.orientationTypeIds].sort(),
  });
  const legacy = legacyIntention(subject, operation);
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
    clearLegacyIntention(subject, operation);
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
