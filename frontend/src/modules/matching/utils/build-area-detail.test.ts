import { describe, expect, it } from "vitest";
import type { RadarAxisId } from "../types/radar-axis-id.types";
import { buildAreaDetail, parseDurationYears } from "./build-area-detail";

describe("parseDurationYears", () => {
  it("convierte años y meses a años redondeados a un decimal", () => {
    expect(parseDurationYears("2 año(s)")).toBe(2);
    expect(parseDurationYears("1,5 año(s)")).toBe(1.5);
    expect(parseDurationYears("18 mes(es)")).toBe(1.5);
    expect(parseDurationYears("6 mes(es)")).toBe(0.5);
  });

  it("devuelve 0 cuando la duración no es reconocible", () => {
    expect(parseDurationYears("sin dato")).toBe(0);
  });
});

describe("buildAreaDetail", () => {
  it("mapea la evidencia autorizada al detalle de área de HU3", () => {
    const detail = buildAreaDetail({
      areaId: "data-ai",
      score: 8,
      average: 6.5,
      evidence: {
        education: [
          {
            id: "edu-1",
            degree: "Maestría en Ciencias de la Computación",
            institution: "UMSS",
            year: 2020,
            description: "Énfasis en aprendizaje automático",
          },
        ],
        certifications: [
          {
            id: "cert-1",
            name: "Machine Learning Specialist",
            issuer: "AWS",
            year: 2022,
          },
        ],
        experiences: [
          {
            id: "exp-1",
            position: "Data Scientist",
            companyName: "Acme",
            duration: "2 año(s)",
            description: "Modelos de recomendación",
          },
        ],
        tags: ["Python", "TensorFlow"],
      },
    });

    expect(detail).toEqual({
      id: "data-ai",
      name: "Data/AI",
      score: 8,
      level: "Alto",
      globalAverage: 6.5,
      gap: 1.5,
      courses: [
        {
          id: "edu-1",
          name: "Maestría en Ciencias de la Computación",
          institution: "UMSS",
          year: 2020,
        },
      ],
      certifications: [
        {
          id: "cert-1",
          name: "Machine Learning Specialist",
          issuer: "AWS",
          year: 2022,
        },
      ],
      experience: [
        {
          id: "exp-1",
          role: "Data Scientist",
          company: "Acme",
          durationYears: 2,
          description: "Modelos de recomendación",
        },
      ],
      tags: ["Python", "TensorFlow"],
    });
  });

  it("usa el identificador como nombre cuando no existe una etiqueta conocida", () => {
    const detail = buildAreaDetail({
      areaId: "area-desconocida" as RadarAxisId,
      score: 3,
      average: 4,
      evidence: {
        education: [],
        certifications: [],
        experiences: [],
        tags: [],
      },
    });

    expect(detail.name).toBe("area-desconocida");
    expect(detail.level).toBe("Bajo");
    expect(detail.gap).toBe(-1);
  });
});
