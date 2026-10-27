import { afterEach, describe, expect, it, vi } from "vitest";
import { readIndexedDb, removeIndexedDb, updateIndexedDb, writeIndexedDb } from "./browser-indexed-db";

function databaseFixture() {
  const request = { result: "saved", onsuccess: null as (() => void) | null };
  const store = { get: vi.fn(() => request), put: vi.fn(), delete: vi.fn() };
  const transaction = {
    objectStore: vi.fn(() => store),
    oncomplete: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onabort: null as (() => void) | null,
    abort: vi.fn(),
    error: null,
  };
  const database = {
    transaction: vi.fn(() => transaction),
    close: vi.fn(),
    onversionchange: null as (() => void) | null,
  };
  const opening = {
    result: database,
    onsuccess: null as (() => void) | null,
    onblocked: null as (() => void) | null,
    onerror: null as (() => void) | null,
  };
  vi.stubGlobal("indexedDB", { open: vi.fn(() => opening) });
  return { request, store, transaction, database, opening };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("wrapper compartido de IndexedDB", () => {
  it("rechaza todas las operaciones cuando el navegador no ofrece almacenamiento", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(readIndexedDb("key")).rejects.toThrow("no está disponible");
    await expect(writeIndexedDb("key", "value")).rejects.toThrow("no está disponible");
    await expect(removeIndexedDb("key")).rejects.toThrow("no está disponible");
    await expect(updateIndexedDb("key", () => "value")).rejects.toThrow("no está disponible");
  });

  it.each(["read", "write", "remove", "update"])("propaga el aborto de %s y cierra la conexión", async (operation) => {
    const fixture = databaseFixture();
    const pending = operation === "read" ? readIndexedDb("key")
      : operation === "write" ? writeIndexedDb("key", "value")
      : operation === "remove" ? removeIndexedDb("key")
      : updateIndexedDb("key", () => "value");
    const rejected = expect(pending).rejects.toThrow("se canceló");
    fixture.opening.onsuccess?.();
    await vi.waitFor(() => expect(fixture.transaction.onabort).toBeTypeOf("function"));
    fixture.transaction.onabort?.();
    await rejected;
    expect(fixture.database.close).toHaveBeenCalledTimes(1);
  });

  it("no anuncia una clave persistida hasta confirmar la transacción", async () => {
    const fixture = databaseFixture();
    const update = vi.fn((current: string | null) => `${current}:next`);
    const settled = vi.fn();
    const pending = updateIndexedDb("key", update);
    void pending.then(settled);
    fixture.opening.onsuccess?.();
    await vi.waitFor(() => expect(fixture.request.onsuccess).toBeTypeOf("function"));
    fixture.request.onsuccess?.();
    await Promise.resolve();
    expect(update).toHaveBeenCalledWith("saved");
    expect(fixture.store.put).toHaveBeenCalledWith("saved:next", "key");
    expect(settled).not.toHaveBeenCalled();
    expect(fixture.database.transaction).toHaveBeenCalledWith("drafts", "readwrite", { durability: "strict" });
    fixture.transaction.oncomplete?.();
    await expect(pending).resolves.toBe("saved:next");
  });

  it("rechaza una apertura bloqueada y cierra la conexión si llega posteriormente", async () => {
    const fixture = databaseFixture();
    const pending = writeIndexedDb("key", "value");
    fixture.opening.onblocked?.();
    await expect(pending).rejects.toThrow("Cierra las otras pestañas");
    fixture.opening.onsuccess?.();
    expect(fixture.database.close).toHaveBeenCalledTimes(1);
    expect(fixture.database.transaction).not.toHaveBeenCalled();
  });
});
