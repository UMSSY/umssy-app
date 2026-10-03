import { describe, expect, it } from "vitest";
import { createSavedCv } from "./create-saved-cv";

describe("createSavedCv", () => {
  it("keeps the name, size and update date of the file as a pdf", () => {
    const file = new File([new Uint8Array(2048)], "CV_Valeria_Quispe.pdf", {
      type: "application/pdf",
    });
    const updatedAt = new Date(2026, 8, 20);

    expect(createSavedCv(file, updatedAt)).toEqual({
      fileName: "CV_Valeria_Quispe.pdf",
      fileType: "PDF",
      sizeInBytes: 2048,
      updatedAt,
    });
  });
});
