import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Application } from "@/modules/applications";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { AppliedJobChip } from "./applied-job-chip";

const getMine = vi.hoisted(() => vi.fn());

vi.mock("@/modules/applications/services/application.service", () => ({
  applicationService: { getMine },
}));

function buildApplication(overrides: Partial<Application>): Application {
  return {
    id: "application-1",
    jobOfferId: "offer-1",
    vacancyTitle: "Backend",
    companyName: "Empresa",
    affinityPercentage: 80,
    status: "En revisión",
    appliedDate: "2026-11-10",
    vacancyAvailable: true,
    ...overrides,
  };
}

describe("AppliedJobChip", () => {
  beforeEach(() => getMine.mockReset());
  afterEach(cleanup);

  it("muestra el chip cuando la postulación está activa", async () => {
    getMine.mockResolvedValue([buildApplication({})]);
    renderWithQuery(<AppliedJobChip jobOfferId="offer-1" />);

    expect(await screen.findByText("Ya te postulaste")).toBeInTheDocument();
  });

  it("no muestra el chip cuando la postulación está retirada", async () => {
    getMine.mockResolvedValue([buildApplication({ status: "Retirada" })]);
    renderWithQuery(<AppliedJobChip jobOfferId="offer-1" />);

    await waitFor(() => expect(getMine).toHaveBeenCalled());
    expect(screen.queryByText("Ya te postulaste")).toBeNull();
  });

  it("no muestra el chip en vacantes sin postulación", async () => {
    getMine.mockResolvedValue([buildApplication({ jobOfferId: "otra" })]);
    renderWithQuery(<AppliedJobChip jobOfferId="offer-1" />);

    await waitFor(() => expect(getMine).toHaveBeenCalled());
    expect(screen.queryByText("Ya te postulaste")).toBeNull();
  });
});
