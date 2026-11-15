import { describe, expect, it, vi } from "vitest";
import { StreamableFile } from "@nestjs/common";
import { CvGenerateController } from "../controllers/cv-generate.controller.js";

describe("CvGenerateController", () => {
  const mockCvGenerationService = {
    generateCv: vi.fn(),
  };

  const controller = new CvGenerateController(mockCvGenerationService as any);

  it("should generate a StreamableFile with PDF attachment disposition", async () => {
    const fakeContent = Buffer.from("%PDF-1.4 simulated");
    mockCvGenerationService.generateCv.mockResolvedValueOnce({
      content: fakeContent,
      fileName: "CV_Romario_Via.pdf",
      mimeType: "application/pdf",
    });

    const request = {
      sections: {
        includeSummary: true,
        includeWorkExperience: true,
      },
    };

    const streamable = await controller.generate("user-123", request);

    expect(streamable).toBeInstanceOf(StreamableFile);
    expect(mockCvGenerationService.generateCv).toHaveBeenCalledWith("user-123", request);
    expect(streamable.getHeaders()).toEqual(
      expect.objectContaining({
        type: "application/pdf",
        disposition: 'attachment; filename="CV_Romario_Via.pdf"',
        length: fakeContent.length,
      }),
    );
  });
});
