import "@/shared/testing/indexed-db.mock";
import { afterEach, describe, expect, it } from "vitest";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/constants/auth.constants";
import { readIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { endSession, startSession } from "./session";
import { hasSessionMarker } from "./session-cookie";

describe("sesión del navegador", () => {
  afterEach(() => endSession());

  it("startSession mantiene el token en memoria sin persistirlo en IndexedDB y pone la cookie marcadora", async () => {
    await startSession("token-de-prueba");

    expect(getAccessToken()).toBe("token-de-prueba");
    expect(hasSessionMarker()).toBe(true);
    expect(document.cookie).not.toContain("token-de-prueba");
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("endSession borra el token y la cookie", async () => {
    await startSession("token-de-prueba");
    endSession();

    expect(getAccessToken()).toBeNull();
    expect(hasSessionMarker()).toBe(false);
  });
});
