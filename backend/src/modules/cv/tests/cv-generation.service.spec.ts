import { describe, expect, it, vi } from "vitest";
import { ProfileNotFoundException } from "../../profile/exceptions/profile-not-found.exception.js";
import { CvGenerationService } from "../services/cv-generation.service.js";

describe("CvGenerationService", () => {
  const mockProfileRepository = {
    findByUserId: vi.fn(),
  };

  const mockEducationsService = {
    findAll: vi.fn(),
  };

  const mockWorkExperienceService = {
    findAll: vi.fn(),
  };

  const mockUserSkillService = {
    getUserSkills: vi.fn(),
  };

  const mockCertificationRecordsService = {
    findManyByUserId: vi.fn(),
  };

  const mockCvPdfGeneratorService = {
    generate: vi.fn(),
  };

  const service = new CvGenerationService(
    mockProfileRepository as any,
    mockEducationsService as any,
    mockWorkExperienceService as any,
    mockUserSkillService as any,
    mockCertificationRecordsService as any,
    mockCvPdfGeneratorService as any,
  );

  const sampleUserId = "user-123";

  it("should throw ProfileNotFoundException if user does not exist", async () => {
    mockProfileRepository.findByUserId.mockResolvedValueOnce(null);

    await expect(service.generateCv(sampleUserId)).rejects.toThrow(
      ProfileNotFoundException,
    );
  });

  it("should gather profile data, invoke PDF generator, and return valid download object", async () => {
    mockProfileRepository.findByUserId.mockResolvedValueOnce({
      id: sampleUserId,
      firstName: "Romario",
      lastName: "Vía Orozco",
      email: "romario@umss.edu.bo",
      personalEmail: "romario@gmail.com",
      phone: "+591 70000000",
      headline: "Ingeniero de Sistemas",
      aboutMe: "Desarrollador con experiencia",
      city: { id: "city-1", title: "Cochabamba" },
    });

    mockEducationsService.findAll.mockResolvedValueOnce([
      {
        id: "edu-1",
        degree: "Licenciatura en Sistemas",
        institution: "UMSS",
        startDate: new Date("2018-02-01"),
        endDate: new Date("2022-12-01"),
        description: "Graduado con honores",
      },
    ]);

    mockWorkExperienceService.findAll.mockResolvedValueOnce([
      {
        id: "exp-1",
        position: "Desarrollador Frontend",
        companyName: "Tech Co",
        startDate: new Date("2023-01-01"),
        endDate: null,
        isCurrent: true,
        description: "Desarrollo con React",
      },
    ]);

    mockUserSkillService.getUserSkills.mockResolvedValueOnce([
      { id: "s-1", name: "TypeScript" },
      { id: "s-2", name: "NestJS" },
    ]);

    mockCertificationRecordsService.findManyByUserId.mockResolvedValueOnce([
      {
        id: "cert-1",
        name: "AWS Certified",
        issuingOrganization: "Amazon",
        issueDate: new Date("2024-01-01"),
      },
    ]);

    const fakePdfBuffer = Buffer.from("%PDF-1.4 simulated pdf content");
    mockCvPdfGeneratorService.generate.mockReturnValueOnce(fakePdfBuffer);

    const result = await service.generateCv(sampleUserId, {
      sections: { includeSummary: true },
      customTitle: "Curriculum Vitae Oficial",
    });

    expect(result.content).toBe(fakePdfBuffer);
    expect(result.fileName).toBe("CV_Romario_Via_Orozco.pdf");
    expect(result.mimeType).toBe("application/pdf");
    expect(mockCvPdfGeneratorService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        personalInfo: expect.objectContaining({
          fullName: "Romario Vía Orozco",
          headline: "Ingeniero de Sistemas",
          email: "romario@umss.edu.bo",
          location: "Cochabamba",
        }),
        summary: "Desarrollador con experiencia",
        educations: expect.arrayContaining([
          expect.objectContaining({ degree: "Licenciatura en Sistemas" }),
        ]),
        workExperiences: expect.arrayContaining([
          expect.objectContaining({ jobTitle: "Desarrollador Frontend", company: "Tech Co" }),
        ]),
        skills: expect.arrayContaining([
          expect.objectContaining({ name: "TypeScript" }),
        ]),
        certifications: expect.arrayContaining([
          expect.objectContaining({ title: "AWS Certified" }),
        ]),
      }),
      {
        sections: { includeSummary: true },
        customTitle: "Curriculum Vitae Oficial",
      },
    );
  });

  it("should handle empty profile fields and clean filenames properly", async () => {
    mockProfileRepository.findByUserId.mockResolvedValueOnce({
      id: sampleUserId,
      firstName: "Ana",
      lastName: "López-Pérez",
      email: "ana@umss.edu.bo",
      personalEmail: null,
      phone: null,
      headline: null,
      aboutMe: null,
      city: null,
    });

    mockEducationsService.findAll.mockResolvedValueOnce([]);
    mockWorkExperienceService.findAll.mockResolvedValueOnce([]);
    mockUserSkillService.getUserSkills.mockResolvedValueOnce([]);
    mockCertificationRecordsService.findManyByUserId.mockResolvedValueOnce([]);

    const fakePdfBuffer = Buffer.from("%PDF-1.4 minimal");
    mockCvPdfGeneratorService.generate.mockReturnValueOnce(fakePdfBuffer);

    const result = await service.generateCv(sampleUserId);

    expect(result.fileName).toBe("CV_Ana_Lopez-Perez.pdf");
    expect(result.content).toBe(fakePdfBuffer);
  });
});
