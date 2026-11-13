import { describe, expect, it } from "vitest";
import { CvGenerationMapper } from "../mappers/cv-generation.mapper.js";

describe("CvGenerationMapper", () => {
  const mapper = new CvGenerationMapper();

  it("maps profile, educations, experiences, skills and certifications to CvDocumentData", () => {
    const result = mapper.toDocumentData({
      profile: {
        id: "user-1",
        firstName: "María",
        lastName: "Pérez",
        institutionalEmail: "maria@umss.edu.bo",
        personalEmail: null,
        phone: "+591 71234567",
        headline: "Desarrolladora Full Stack",
        aboutMe: "Perfil profesional",
        city: { id: "c-1", title: "Cochabamba" },
        updatedAt: "2026-11-01T00:00:00.000Z",
      },
      educations: [
        {
          id: "edu-1",
          degree: "Licenciatura en Informática",
          institution: "UMSS",
          startDate: "2019-02-01",
          endDate: "2023-12-01",
          description: "Mención Ingeniería de Software",
        },
      ],
      experiences: [
        {
          id: "exp-1",
          position: "Backend Developer",
          companyName: "Empresa SRL",
          startDate: "2024-01-15",
          endDate: null,
          isCurrent: true,
          description: "Desarrollo de microservicios",
        },
      ],
      skills: [{ id: "s-1", name: "TypeScript", isCustom: false }],
      certifications: [
        {
          id: "cert-1",
          userId: "user-1",
          name: "NestJS Expert",
          issuingOrganization: "Trilon",
          issueDate: new Date("2024-06-01T00:00:00.000Z"),
          createdAt: new Date("2024-06-01T00:00:00.000Z"),
          updatedAt: new Date("2024-06-01T00:00:00.000Z"),
        },
      ],
    });

    expect(result.personalInfo.fullName).toBe("María Pérez");
    expect(result.personalInfo.email).toBe("maria@umss.edu.bo");
    expect(result.personalInfo.location).toBe("Cochabamba");
    expect(result.educations).toHaveLength(1);
    expect(result.educations?.[0].startDate).toBe("2019-02-01");
    expect(result.workExperiences).toHaveLength(1);
    expect(result.workExperiences?.[0].startDate).toBe("2024-01-15");
    expect(result.skills).toEqual([{ name: "TypeScript" }]);
    expect(result.certifications).toEqual([
      {
        title: "NestJS Expert",
        issuingOrganization: "Trilon",
        issueDate: "2024-06-01",
      },
    ]);
  });
});
