import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadCvInMemory } from "./upload-cv-in-memory";

describe("uploadCvInMemory", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves the saved cv with the current date", async () => {
    const now = new Date(2026, 8, 20, 10, 30);
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const file = new File([new Uint8Array(1024)], "CV.pdf", { type: "application/pdf" });

    await expect(uploadCvInMemory(file)).resolves.toEqual({
      fileName: "CV.pdf",
      fileType: "PDF",
      sizeInBytes: 1024,
      updatedAt: now,
    });
  });
});
