import { removeIndexedDbByPrefix } from "@/shared/services/storage/browser-indexed-db";
import { SESSION_DRAFT_STORAGE_PREFIX } from "../constants/session.constants";

export function clearSessionDrafts(): Promise<void> {
  return removeIndexedDbByPrefix(SESSION_DRAFT_STORAGE_PREFIX).catch(() => undefined);
}
