import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import type { AreaEvidence, RecruiterApplicantsResponse, RecruiterVacancy } from "../types/radar-recruiter.types";
import { radarRecruiterApi } from "./radar-recruiter.service";

const VACANCY: RecruiterVacancy = {
  id: "vac-1",
  title: "Tech Lead",
  companyId: "company-1",
};

const EVIDENCE: AreaEvidence = {
  education: [],
  certifications: [],
  experiences: [],
  tags: ["React"],
};

const APPLICANTS: RecruiterApplicantsResponse = {
  vacancy: {
    id: "vac-1",
    title: "Tech Lead",
    target: {
      desarrollo: 7,
      "cloud-devops": 6,
      "data-ai": 6,
      qa: 5,
      ciberseguridad: 5,
      "gobernanza-ti": 6,
    },
  },
  applicants: [],
};

describe("radarRecruiterApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("consulta las vacantes del reclutador", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce({ data: { data: [VACANCY] } });

    await expect(radarRecruiterApi.vacancies()).resolves.toEqual([VACANCY]);
    expect(getSpy).toHaveBeenCalledWith("/radar-integration/recruiter/vacancies");
  });

  it("consulta los postulantes de una vacante", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce({ data: { data: APPLICANTS } });

    await expect(radarRecruiterApi.applicants("vac-1")).resolves.toEqual(APPLICANTS);
    expect(getSpy).toHaveBeenCalledWith(
      "/radar-integration/recruiter/vacancies/vac-1/applicants"
    );
  });

  it("consulta la evidencia autorizada de un área", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce({ data: { data: EVIDENCE } });

    await expect(radarRecruiterApi.areaEvidence("app-1", "data-ai")).resolves.toEqual(
      EVIDENCE
    );
    expect(getSpy).toHaveBeenCalledWith(
      "/radar-integration/recruiter/applications/app-1/areas/data-ai/evidence"
    );
  });

  it("descarga el CV autorizado como blob", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce({ data: blob });

    await expect(radarRecruiterApi.recruiterCv("app-1")).resolves.toBe(blob);
    expect(getSpy).toHaveBeenCalledWith(
      "/radar-integration/recruiter/applications/app-1/cv",
      { responseType: "blob" }
    );
  });

  it("registra la decisión del reclutador", async () => {
    const patchSpy = vi
      .spyOn(apiClient, "patch")
      .mockResolvedValueOnce({ data: { data: { id: "app-1", state: "hired" } } });

    await expect(radarRecruiterApi.decide("app-1", "hired")).resolves.toEqual({
      id: "app-1",
      state: "hired",
    });
    expect(patchSpy).toHaveBeenCalledWith(
      "/radar-integration/recruiter/applications/app-1",
      { decision: "hired" }
    );
  });
});
