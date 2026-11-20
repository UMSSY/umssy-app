import { afterEach, describe, expect, it, vi } from "vitest";
import { removeIndexedDbByPrefix } from "@/shared/services/storage/browser-indexed-db";
import { SESSION_DRAFT_STORAGE_PREFIX } from "../constants/session.constants";
import { clearSessionDrafts } from "./clear-session-drafts";

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  removeIndexedDbByPrefix: vi.fn(async () => undefined),
}));

afterEach(() => vi.clearAllMocks());

describe("clearSessionDrafts", () => {
  it("elimina los borradores de sesión mediante el almacenamiento compartido", async () => {
    await clearSessionDrafts();

    expect(removeIndexedDbByPrefix).toHaveBeenCalledWith(SESSION_DRAFT_STORAGE_PREFIX);
  });

  it("no propaga el error cuando el almacenamiento no está disponible", async () => {
    vi.mocked(removeIndexedDbByPrefix).mockRejectedValueOnce(new Error("IndexedDB no está disponible"));

    await expect(clearSessionDrafts()).resolves.toBeUndefined();
  });
});
