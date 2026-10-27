import { beforeEach, describe, expect, it, vi } from "vitest";
import { withMentorIntakeKey } from "./mentor-intake-idempotency";

const preferences = { technicalAreaIds: ["a", "b"], orientationTypeIds: ["o"] };
const networkFailure = { isAxiosError: true };
const serverFailure = { isAxiosError: true, response: { status: 503 } };

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem("accessToken", `header.${btoa(JSON.stringify({ sub: crypto.randomUUID() }))}.signature`);
});

describe("UUID para intenciones de participación", () => {
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
    expect(sessionStorage.getItem("hu7:intake:request")).toBeNull();
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
    expect(keys[0]).toBe(keys[1]);
    finish();
    await Promise.all([first, second]);
  });
});
