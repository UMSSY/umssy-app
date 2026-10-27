import { beforeEach, describe, expect, it, vi } from "vitest";
import { withMentorIntakeKey } from "./mentor-intake-idempotency";

const records = vi.hoisted(() => new Map<string, unknown>());
vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => records.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => { records.set(key, value); }),
  removeIndexedDb: vi.fn(async (key: string) => { records.delete(key); }),
}));

const preferences = { technicalAreaIds: ["a", "b"], orientationTypeIds: ["o"] };
const networkFailure = { isAxiosError: true };
const serverFailure = { isAxiosError: true, response: { status: 503 } };

beforeEach(() => {
  records.clear();
  sessionStorage.clear();
  sessionStorage.setItem("accessToken", `header.${btoa(JSON.stringify({ sub: crypto.randomUUID() }))}.signature`);
});

describe("UUID para intenciones de participación", () => {
  it("migra el UUID previo a idb sin duplicar la intención y lo retira al completarla", async () => {
    const subject = JSON.parse(atob(sessionStorage.getItem("accessToken")!.split(".")[1])).sub;
    const key = crypto.randomUUID();
    sessionStorage.setItem("hu7:intake:request", JSON.stringify({ subject, key, fingerprint: JSON.stringify(preferences) }));
    const first = vi.fn(async () => { throw networkFailure; });
    await expect(withMentorIntakeKey("request", preferences, first)).rejects.toEqual(networkFailure);
    expect(first).toHaveBeenCalledWith(key);
    vi.resetModules();
    const reloaded = await import("./mentor-intake-idempotency");
    const retry = vi.fn(async (retriedKey: string) => retriedKey);
    expect(await reloaded.withMentorIntakeKey("request", preferences, retry)).toBe(key);
    expect(sessionStorage.getItem("hu7:intake:request")).toBeNull();
    expect(records.size).toBe(0);
  });

  it("no reutiliza ni elimina una intención anterior perteneciente a otro usuario", async () => {
    const key = crypto.randomUUID();
    sessionStorage.setItem("hu7:intake:request", JSON.stringify({ subject: "another-user", key, fingerprint: JSON.stringify(preferences) }));
    const result = await withMentorIntakeKey("request", preferences, async (createdKey) => createdKey);
    expect(result).not.toBe(key);
    expect(JSON.parse(sessionStorage.getItem("hu7:intake:request")!).key).toBe(key);
  });

  it("conserva la clave después de un fallo de red y 5xx, incluyendo preferencias reordenadas", async () => {
    const keys: string[] = [];
    const submit = vi.fn(async (key: string) => {
      keys.push(key);
      if (keys.length === 1) throw networkFailure;
      if (keys.length === 2) throw serverFailure;
      return { ok: true };
    });
    await expect(withMentorIntakeKey("request", preferences, submit)).rejects.toEqual(networkFailure);
    await expect(withMentorIntakeKey("request", preferences, submit)).rejects.toEqual(serverFailure);
    await withMentorIntakeKey("request", { ...preferences, technicalAreaIds: ["b", "a"] }, submit);
    expect(new Set(keys).size).toBe(1);
    expect(records.size).toBe(0);
    await withMentorIntakeKey("request", preferences, submit);
    expect(keys[3]).not.toBe(keys[0]);
  });

  it("recupera la intención del almacenamiento después de recargar el módulo", async () => {
    const submit = vi.fn(async (key: string) => { expect(key).toHaveLength(36); throw networkFailure; });
    await expect(withMentorIntakeKey("activate", preferences, submit)).rejects.toEqual(networkFailure);
    const key = submit.mock.calls[0][0];
    vi.resetModules();
    const reloaded = await import("./mentor-intake-idempotency");
    const retry = vi.fn(async (key: string) => ({ key }));
    await reloaded.withMentorIntakeKey("activate", preferences, retry);
    expect(retry).toHaveBeenCalledWith(key);
  });

  it("cambia de clave para otras preferencias, usuario u operación y después de un rechazo definitivo", async () => {
    const keys: string[] = [];
    const submit = vi.fn(async (key: string) => { keys.push(key); throw networkFailure; });
    const call = async (operation: "request" | "activate", form = preferences) =>
      expect(withMentorIntakeKey(operation, form, submit)).rejects.toEqual(networkFailure);
    await call("request");
    await call("request", { ...preferences, technicalAreaIds: ["c"] });
    await call("activate");
    sessionStorage.setItem("accessToken", `header.${btoa(JSON.stringify({ sub: "another-user" }))}.signature`);
    await call("request");
    expect(new Set(keys).size).toBe(4);
    const rejected = vi.fn(async (key: string) => { expect(key).toHaveLength(36); throw { isAxiosError: true, response: { status: 409 } }; });
    await expect(withMentorIntakeKey("request", preferences, rejected)).rejects.toMatchObject({ response: { status: 409 } });
    await call("request");
    expect(keys.at(-1)).not.toBe(rejected.mock.calls[0][0]);
  });

  it("dos llamadas simultáneas de la misma intención comparten clave", async () => {
    const keys: string[] = [];
    let finish!: () => void;
    const waiting = new Promise<void>((resolve) => { finish = resolve; });
    const submit = async (key: string) => { keys.push(key); await waiting; return true; };
    const first = withMentorIntakeKey("request", preferences, submit);
    const second = withMentorIntakeKey("request", preferences, submit);
    await vi.waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[0]).toBe(keys[1]);
    finish();
    await Promise.all([first, second]);
  });
});
