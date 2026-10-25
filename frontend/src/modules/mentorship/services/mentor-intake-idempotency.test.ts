import { afterEach, describe, expect, it, vi } from "vitest";
import { withIntakeKey } from "./mentor-intake-idempotency";

const preferences = { technicalAreaIds: ["area"], orientationTypeIds: ["orientation"] };
afterEach(() => sessionStorage.clear());

describe("clave idempotente del ingreso HU7/HU3", () => {
  it("recupera un fallo de red con la misma clave", async () => {
    const keys: string[] = [];
    await expect(withIntakeKey("request", preferences, async (key) => {
      keys.push(key);
      throw new Error("network");
    })).rejects.toThrow("network");
    await withIntakeKey("request", preferences, async (key) => { keys.push(key); return true; });
    expect(keys[1]).toBe(keys[0]);
  });

  it("usa nueva clave tras una respuesta de negocio y para una decisión nueva", async () => {
    const keys: string[] = [];
    await expect(withIntakeKey("activate", preferences, async (key) => {
      keys.push(key);
      throw { isAxiosError: true, response: { status: 409 } };
    })).rejects.toBeTruthy();
    await withIntakeKey("activate", preferences, async (key) => { keys.push(key); return true; });
    expect(keys[1]).not.toBe(keys[0]);
    const third = vi.fn(async (key: string) => key);
    await withIntakeKey("activate", preferences, third);
    expect(third.mock.calls[0][0]).not.toBe(keys[1]);
  });
});
