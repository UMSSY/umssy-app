import { afterEach, describe, expect, it, vi } from "vitest";
import { createId } from "./create-id";

describe("createId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("genera identificadores únicos", () => {
    expect(createId()).not.toBe(createId());
  });

  it("usa un respaldo cuando no existe crypto.randomUUID", () => {
    vi.stubGlobal("crypto", {});

    const first = createId();

    expect(first).toMatch(/^id-/);
    expect(createId()).not.toBe(first);
  });
});
