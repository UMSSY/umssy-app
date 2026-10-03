import { describe, expect, it } from "vitest";
import { deleteCvInMemory } from "./delete-cv-in-memory";

describe("deleteCvInMemory", () => {
  it("resolves without errors", async () => {
    await expect(deleteCvInMemory()).resolves.toBeUndefined();
  });
});
