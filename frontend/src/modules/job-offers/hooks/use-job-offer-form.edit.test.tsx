import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import { buildSessionToken, COMPANY_ID, DOCKER } from "../testing/vacancy-fixtures";
import type { JobOfferDetailsResponse } from "../types/job-offer-details-response.types";
import { useJobOfferForm } from "./use-job-offer-form";

vi.mock("../services/job-offers.service", () => ({ jobOffersService: { getByCompanyAndId: vi.fn() } }));

const OFFER: JobOfferDetailsResponse = {
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

describe("useJobOfferForm en modo edición", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMPANY_ID", COMPANY_ID);
    saveAccessToken(buildSessionToken("empresa"));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    clearAccessToken();
  });

  it("carga la vacante de la empresa y arranca sin cambios pendientes", async () => {
    vi.mocked(jobOffersService.getByCompanyAndId).mockResolvedValue(OFFER);
    const { result } = renderHook(() => useJobOfferForm("offer-1"), createQueryWrapper());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(jobOffersService.getByCompanyAndId).toHaveBeenCalledWith(COMPANY_ID, "offer-1");
    expect(result.current.conditions).toMatchObject({
      title: "DevOps Senior",
      vacancyCount: "2",
      salary: "Bs 6.500 - 8.000",
      skills: [DOCKER],
    });
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("muestra los datos aunque la vacante ya esté en caché y no avisa de cambios al cancelar", () => {
    const { wrapper, client } = createQueryWrapper();
    client.setQueryData(JOB_OFFERS_QUERY_KEYS.companyOfferDetails(COMPANY_ID, "offer-1"), OFFER);

    const { result } = renderHook(() => useJobOfferForm("offer-1"), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.conditions).toMatchObject({ title: "DevOps Senior", skills: [DOCKER] });
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("no pisa lo que se está editando si la consulta de la vacante se repite", async () => {
    vi.mocked(jobOffersService.getByCompanyAndId).mockResolvedValue(OFFER);
    const { wrapper, client } = createQueryWrapper();
    const { result } = renderHook(() => useJobOfferForm("offer-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.updateField("title", "DevOps Lead"));
    vi.mocked(jobOffersService.getByCompanyAndId).mockResolvedValue({ ...OFFER, title: "DevOps Senior II" });
    await act(() => client.refetchQueries());

    expect(result.current.conditions.title).toBe("DevOps Lead");
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("deja avanzar sin errores de validación con los datos cargados", async () => {
    vi.mocked(jobOffersService.getByCompanyAndId).mockResolvedValue(OFFER);
    const { result } = renderHook(() => useJobOfferForm("offer-1"), createQueryWrapper());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.handleContinue());

    expect(result.current.errors).toEqual({});
    expect(result.current.currentStep).toBe(2);
  });

  it("marca cambios al editar y vuelve a la vacante cargada al descartar", async () => {
    vi.mocked(jobOffersService.getByCompanyAndId).mockResolvedValue(OFFER);
    const { result } = renderHook(() => useJobOfferForm("offer-1"), createQueryWrapper());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.updateField("title", "SRE"));
    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => result.current.reset());
    expect(result.current.conditions.title).toBe("DevOps Senior");
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("expone el error si la vacante no se puede cargar", async () => {
    vi.mocked(jobOffersService.getByCompanyAndId).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useJobOfferForm("offer-1"), createQueryWrapper());

    await waitFor(() => expect(result.current.loadError).not.toBeNull());
    expect(result.current.isLoading).toBe(false);
  });

  it("en alta no consulta ninguna vacante ni queda cargando", () => {
    const { result } = renderHook(() => useJobOfferForm(), createQueryWrapper());

    expect(jobOffersService.getByCompanyAndId).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.loadError).toBeNull();
  });
});
