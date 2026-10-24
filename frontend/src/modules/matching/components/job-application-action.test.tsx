import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { jobApplicationService } from "../services/job-application.service";
import type { JobApplication } from "../types/job-application.types";
import { JobApplicationAction } from "./job-application-action";

vi.mock("../services/job-application.service", () => ({
  jobApplicationService: { apply: vi.fn(), getMine: vi.fn() },
}));

const mockedService = vi.mocked(jobApplicationService);

const APPLICATION: JobApplication = {
  id: "application-1",
  jobOfferId: "offer-1",
  jobTitle: "DevOps Senior",
  companyName: "TechBolivia",
  appliedAt: "2026-11-10T14:00:00.000Z",
  status: "En revisión",
};

function conflictError(): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError("Conflict", "ERR_BAD_REQUEST", { headers }, undefined, {
    status: 409,
    statusText: "Conflict",
    data: { detail: "Ya te postulaste a esta vacante." },
    headers,
    config: { headers },
  });
}

async function findEnabledApplyButton(): Promise<HTMLElement> {
  const button = await screen.findByRole("button", { name: "Enviar postulación" });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}

describe("HU-02B T2.10 - JobApplicationAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedService.getMine.mockResolvedValue({ hasApplied: false, application: null });
  });

  afterEach(cleanup);

  it("shows the apply button when the user has not applied yet", async () => {
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    expect(await findEnabledApplyButton()).toBeEnabled();
  });

  it("AC-02.7: applies with one click and shows the confirmation summary", async () => {
    mockedService.apply.mockResolvedValue(APPLICATION);
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());

    const dialog = await screen.findByRole("dialog");
    expect(mockedService.apply).toHaveBeenCalledWith("offer-1");
    expect(screen.getByText("¡Postulación enviada!")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("DevOps Senior");
    expect(dialog).toHaveTextContent("TechBolivia");
    expect(dialog).toHaveTextContent("10 nov 2026");
    expect(dialog).toHaveTextContent("En revisión");
  });

  it("AC-02.8: replaces the button with \"Ya te postulaste\" after applying", async () => {
    mockedService.apply.mockResolvedValue(APPLICATION);
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());
    fireEvent.click(await screen.findByRole("button", { name: "Entendido" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Ya te postulaste" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Enviar postulación" })).not.toBeInTheDocument();
  });

  it("AC-02.8: does not allow applying again when an application already exists", async () => {
    mockedService.getMine.mockResolvedValue({ hasApplied: true, application: APPLICATION });
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    expect(await screen.findByRole("button", { name: "Ya te postulaste" })).toBeDisabled();
    expect(screen.getByText(/Postulaste el 10 nov 2026/)).toBeInTheDocument();
    expect(mockedService.apply).not.toHaveBeenCalled();
  });

  it("AC-02.8: shows \"Ya te postulaste\" when the backend answers 409", async () => {
    mockedService.apply.mockRejectedValue(conflictError());
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());
    mockedService.getMine.mockResolvedValue({ hasApplied: true, application: APPLICATION });

    expect(await screen.findByRole("button", { name: "Ya te postulaste" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error message when the application fails", async () => {
    mockedService.apply.mockRejectedValue(new Error("network"));
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos enviar tu postulación");
    expect(screen.getByRole("button", { name: "Enviar postulación" })).toBeEnabled();
  });
});
