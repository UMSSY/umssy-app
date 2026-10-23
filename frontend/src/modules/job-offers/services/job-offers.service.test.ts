import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { COMPANY_ID, DOCKER, PYTHON, VALID_CONDITIONS } from "../testing/vacancy-fixtures";
import { toJobOfferPayload } from "../utils/to-job-offer-payload";
import type { JobOfferDetailsResponse } from "../types/job-offer.types";
import { jobOffersService } from "./job-offers.service";

vi.mock("@/shared/services/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/api-client")>()), apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

describe("jobOffersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("obtiene el catálogo de tecnologías del módulo de vacantes", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "", data: [{ ...PYTHON, extra: 1 }, DOCKER] },
    });

    await expect(jobOffersService.getSkillCatalog()).resolves.toEqual([PYTHON, DOCKER]);
    expect(apiClient.get).toHaveBeenCalledWith("/job-offers/skills");
  });

  it("devuelve un catálogo vacío si el backend no envía datos", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { statusCode: 200, ok: true, detail: "", data: null } });

    await expect(jobOffersService.getSkillCatalog()).resolves.toEqual([]);
  });

  it("publica la vacante en el endpoint de la empresa", async () => {
    const created = { id: "offer-1", createdAt: "2026-10-12T00:00:00.000Z" };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { statusCode: 201, data: created, detail: "", ok: true } });
    const payload = toJobOfferPayload(VALID_CONDITIONS);

    await expect(jobOffersService.publish(COMPANY_ID, payload)).resolves.toEqual(created);
    expect(apiClient.post).toHaveBeenCalledWith(`/companies/${COMPANY_ID}/job-offers`, payload);
  });

  it("propaga el error para que el hook lo traduzca", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("boom"));

    await expect(jobOffersService.publish(COMPANY_ID, toJobOfferPayload(VALID_CONDITIONS))).rejects.toThrow("boom");
  });

  it("conserva los campos de la lista y normaliza postulantes ausentes", async () => {
    const offer: JobOfferDetailsResponse = {
      id: "offer-1",
      title: "DevOps Senior",
      description: "Descripción",
      category: "Tecnología",
      modality: "Híbrido",
      contractType: "Tiempo completo",
      status: "Publicada",
      positionsAvailable: 2,
      salaryRange: "Bs 6.500 - 8.000",
      languages: "Español",
      locationUrl: "https://maps.app.goo.gl/TechBolivia",
      expiresAt: null,
      createdAt: "2026-10-12T00:00:00.000Z",
      company: { id: COMPANY_ID, name: "TechBolivia" },
      skills: [DOCKER],
    };
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        statusCode: 200,
        ok: true,
        detail: "",
        data: [{ ...offer, applicantsCount: 3 }, offer],
      },
    });

    await expect(jobOffersService.getByCompany(COMPANY_ID)).resolves.toEqual([
      { ...offer, applicantsCount: 3 },
      { ...offer, applicantsCount: 0 },
    ]);
  });

  it("devuelve una lista vacía cuando no hay datos", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "", data: null },
    });

    await expect(jobOffersService.getByCompany(COMPANY_ID)).resolves.toEqual([]);
  });

  it("consulta los detalles de una vacante por empresa e identificador", async () => {
    const offer: JobOfferDetailsResponse = {
      id: "offer-1",
      title: "DevOps Senior",
      description: "Descripción",
      category: "Tecnología",
      modality: "Híbrido",
      contractType: "Tiempo completo",
      status: "Publicada",
      positionsAvailable: 2,
      salaryRange: "Bs 6.500 - 8.000",
      languages: "Español, Inglés",
      locationUrl: "https://maps.app.goo.gl/TechBolivia",
      expiresAt: null,
      createdAt: "2026-10-12T00:00:00.000Z",
      company: { id: COMPANY_ID, name: "TechBolivia" },
      skills: [{ id: "skill-1", name: "Docker" }],
    };
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "", data: offer },
    });

    await expect(jobOffersService.getByCompanyAndId(COMPANY_ID, "offer-1")).resolves.toEqual(offer);
    expect(apiClient.get).toHaveBeenCalledWith(
      `/companies/${COMPANY_ID}/job-offers/offer-1`,
    );
  });

  it("edita la vacante en el endpoint de la empresa", async () => {
    const updated = { id: "offer-1", title: "DevOps Senior" };
    vi.mocked(apiClient.put).mockResolvedValue({ data: { statusCode: 200, ok: true, detail: "", data: updated } });
    const payload = toJobOfferPayload(VALID_CONDITIONS);

    await expect(jobOffersService.update(COMPANY_ID, "offer-1", payload)).resolves.toEqual(updated);
    expect(apiClient.put).toHaveBeenCalledWith(`/companies/${COMPANY_ID}/job-offers/offer-1`, payload);
  });
});
