import { describe, expect, it } from "vitest";
import * as mupdf from "mupdf";
import { CvPdfGeneratorService } from "../services/cv-pdf-generator.service.js";
import type { CvDocumentData } from "../types/cv-document-data.type.js";

describe("CvPdfGeneratorService", () => {
  const service = new CvPdfGeneratorService();

  const mockCompleteData: CvDocumentData = {
    personalInfo: {
      fullName: "Romario Vía Orozco",
      headline: "Ingeniero de Sistemas & Desarrollador Full Stack",
      email: "romario.via@umss.edu.bo",
      phone: "+591 71234567",
      location: "Cochabamba, Bolivia",
      githubUrl: "https://github.com/romario-via",
      gitlabUrl: "https://gitlab.com/romario-via",
      portfolioUrl: "https://romariovia.dev",
      linkedinUrl: "https://linkedin.com/in/romariovia",
    },
    summary:
      "Ingeniero de Sistemas titulado de la Universidad Mayor de San Simón con más de 3 años de experiencia en desarrollo de software moderno con arquitecturas orientadas a servicios, NestJS, React, TypeScript y PostgreSQL. Apasionado por la calidad de código y diseño limpio.",
    workExperiences: [
      {
        jobTitle: "Encargado de Redes y Servicios",
        company: "Redes SOLU S.R.L.",
        location: "Cochabamba",
        startDate: "2023-11-01",
        endDate: null,
        isCurrent: true,
        description:
          "Administración de infraestructura de red, despliegue de contenedores Docker y monitoreo de servicios cloud para clientes corporativos.",
      },
      {
        jobTitle: "Desarrollador Backend Junior",
        company: "Tech Solutions Bolivia",
        location: "La Paz",
        startDate: "2022-01-15",
        endDate: "2023-10-31",
        isCurrent: false,
        description:
          "Desarrollo y mantenimiento de APIs RESTful utilizando Node.js, Express y bases de datos relacionales PostgreSQL con alta concurrencia.",
      },
    ],
    educations: [
      {
        degree: "Licenciatura en Ingeniería de Sistemas",
        institution: "Universidad Mayor de San Simón (UMSS)",
        location: "Cochabamba, Bolivia",
        startDate: "2018-02-01",
        endDate: "2022-12-15",
        isCurrent: false,
        description:
          "Graduado por excelencia académica. Proyecto de grado enfocado en sistemas distribuidos y reconocimiento de patrones.",
      },
    ],
    skills: [
      { name: "TypeScript" },
      { name: "NestJS" },
      { name: "PostgreSQL" },
      { name: "Docker" },
      { name: "React" },
      { name: "Next.js" },
      { name: "Git & GitHub" },
    ],
    certifications: [
      {
        title: "AWS Certified Solutions Architect - Associate",
        issuingOrganization: "Amazon Web Services",
        issueDate: "2024-05-10",
        credentialUrl: "https://aws.amazon.com/verify/12345",
      },
      {
        title: "Scrum Master Professional Certificate",
        issuingOrganization: "CertiProf",
        issueDate: "2023-08-20",
      },
    ],
    projects: [
      {
        title: "sistema-gestion-umss",
        role: "Dueño",
        primaryLanguage: "TypeScript",
        starsCount: 15,
        description:
          "Plataforma web para gestión y acreditación académica con PostgreSQL y NestJS.",
        url: "https://github.com/romario-via/sistema-gestion-umss",
      },
    ],
  };

  it("should generate a valid PDF buffer starting with %PDF-1.4 header", () => {
    const buffer = service.generate(mockCompleteData);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    const header = buffer.subarray(0, 8).toString("latin1");
    expect(header).toContain("%PDF-1.4");
  });

  it("should be successfully parsable by MuPDF without corruption", () => {
    const buffer = service.generate(mockCompleteData);
    const doc = new mupdf.PDFDocument(buffer);

    expect(doc.countPages()).toBeGreaterThanOrEqual(1);

    const firstPage = doc.loadPage(0);
    const structured = firstPage.toStructuredText().asJSON();
    expect(structured).toContain("Romario");
    expect(structured).toContain("Sistemas");
  });

  it("should correctly handle Spanish accented characters and tildes", () => {
    const buffer = service.generate(mockCompleteData);
    const doc = new mupdf.PDFDocument(buffer);
    const firstPage = doc.loadPage(0);
    const textJson = firstPage.toStructuredText().asJSON();

    expect(textJson).toContain("Ingeniero");
    expect(textJson).toContain("Simón");
    expect(textJson).toContain("PRESENTACIÓN PROFESIONAL");
  });

  it("should generate a valid single-page PDF when only minimal personal info is supplied", () => {
    const minimalData: CvDocumentData = {
      personalInfo: {
        fullName: "María José Peña",
        email: "maria.pena@umss.edu.bo",
      },
    };

    const buffer = service.generate(minimalData);
    const doc = new mupdf.PDFDocument(buffer);

    expect(doc.countPages()).toBe(1);

    const page = doc.loadPage(0);
    const textJson = page.toStructuredText().asJSON();
    expect(textJson).toContain("María");
    expect(textJson).toContain("Peña");
    expect(textJson).toContain("maria.pena@umss.edu.bo");
  });

  it("should respect section inclusion and exclusion filters", () => {
    const buffer = service.generate(mockCompleteData, {
      sections: {
        includeSummary: false,
        includeCertifications: false,
        includeProjects: false,
      },
    });

    const doc = new mupdf.PDFDocument(buffer);
    const page = doc.loadPage(0);
    const textJson = page.toStructuredText().asJSON();

    expect(textJson).not.toContain("PRESENTACIÓN PROFESIONAL");
    expect(textJson).not.toContain("CERTIFICACIONES");
    expect(textJson).not.toContain("PROYECTOS DESTACADOS");
    expect(textJson).toContain("EXPERIENCIA LABORAL");
    expect(textJson).toContain("FORMACIÓN ACADÉMICA");
  });

  it("should omit personal contact information when includeContactInfo is false", () => {
    const buffer = service.generate(mockCompleteData, {
      sections: {
        includeContactInfo: false,
      },
    });

    const doc = new mupdf.PDFDocument(buffer);
    const page = doc.loadPage(0);
    const textJson = page.toStructuredText().asJSON();

    expect(textJson).toContain("Romario Vía Orozco");
    expect(textJson).toContain("Ingeniero de Sistemas");
    expect(textJson).not.toContain("romario.via@umss.edu.bo");
    expect(textJson).not.toContain("+591 71234567");
    expect(textJson).not.toContain("romariovia.dev");
  });


  it("should support multi-page documents and add correct footers and continuation headers", () => {
    const longExperiences = Array.from({ length: 8 }, (_, idx) => ({
      jobTitle: `Cargo de Especialista Senior Nro ${idx + 1}`,
      company: `Corporación de Software y Tecnología Avanzada ${idx + 1}`,
      location: "Cochabamba, Bolivia",
      startDate: "2020-01-01",
      endDate: "2021-12-31",
      isCurrent: false,
      description:
        "Liderazgo técnico en desarrollo de microservicios, optimización de queries SQL en PostgreSQL, diseño de pipelines CI/CD y despliegue en Kubernetes con monitoreo proactivo mediante Prometheus y Grafana.",
    }));

    const multiPageData: CvDocumentData = {
      ...mockCompleteData,
      workExperiences: longExperiences,
    };

    const buffer = service.generate(multiPageData);
    const doc = new mupdf.PDFDocument(buffer);

    expect(doc.countPages()).toBeGreaterThanOrEqual(2);

    const page2 = doc.loadPage(1);
    const page2Text = page2.toStructuredText().asJSON();
    expect(page2Text).toContain("Romario Vía Orozco");
    expect(page2Text).toContain("Currículum Vitae");
    expect(page2Text).toContain("Página 2 de");
  });

  it("should properly escape parentheses, backslashes and special symbols in text", () => {
    const escaped = (service as any).escapePdfText("Test (parentheses) and \\ backslash and • bullet");
    expect(escaped).toContain("\\(");
    expect(escaped).toContain("\\)");
    expect(escaped).toContain("\\\\");
    expect(escaped).toContain("\\225");
  });
});
