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
  const button = await screen.findByRole("button", {
    name: "Enviar postulación",
  });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  const confirm = await screen.findByRole("button", {
    name: "Confirmar postulaci\u00f3n",
  });
  expect(confirm).toBeDisabled();
  const boxes = screen.getAllByRole("checkbox");
  fireEvent.click(boxes[0]);
  expect(confirm).toBeDisabled();
  fireEvent.click(boxes[1]);
  expect(confirm).toBeDisabled();
  expect(mockedService.apply).not.toHaveBeenCalled();
  fireEvent.click(boxes[2]);
  expect(confirm).toBeEnabled();
  return confirm;
}

describe("HU-02B T2.10 - JobApplicationAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedService.getMine.mockResolvedValue({
      hasApplied: false,
      application: null,
    });
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

    const dialog = await screen.findByRole("dialog", {
      name: "\u00a1Postulaci\u00f3n enviada!",
    });
    expect(mockedService.apply).toHaveBeenCalledWith("offer-1", {
      consent: true,
      consentCv: true,
      consentContact: true,
    });
    expect(screen.getByText("¡Postulación enviada!")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("DevOps Senior");
    expect(dialog).toHaveTextContent("TechBolivia");
    expect(dialog).toHaveTextContent("10 nov 2026");
    expect(dialog).toHaveTextContent("En revisión");
  });

  it('AC-02.8: replaces the button with "Ya te postulaste" after applying', async () => {
    mockedService.apply.mockResolvedValue(APPLICATION);
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());
    fireEvent.click(await screen.findByRole("button", { name: "Entendido" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Ya te postulaste" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Enviar postulación" }),
    ).not.toBeInTheDocument();
  });

  it("AC-02.8: does not allow applying again when an application already exists", async () => {
    mockedService.getMine.mockResolvedValue({
      hasApplied: true,
      application: APPLICATION,
    });
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    expect(
      await screen.findByRole("button", { name: "Ya te postulaste" }),
    ).toBeDisabled();
    expect(screen.getByText(/Postulaste el 10 nov 2026/)).toBeInTheDocument();
    expect(mockedService.apply).not.toHaveBeenCalled();
  });

  it('AC-02.8: shows "Ya te postulaste" when the backend answers 409', async () => {
    mockedService.apply.mockRejectedValue(conflictError());
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());
    mockedService.getMine.mockResolvedValue({
      hasApplied: true,
      application: APPLICATION,
    });

    expect(
      await screen.findByRole("button", { name: "Ya te postulaste" }),
    ).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("allows applying when the backend reports no active application", async () => {
    mockedService.getMine.mockResolvedValue({
      hasApplied: false,
      application: null,
    });
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    expect(await findEnabledApplyButton()).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Ya te postulaste" }),
    ).not.toBeInTheDocument();
  });

  it("AC-02.13: sends only one request when the apply button is clicked twice quickly", async () => {
    let finishRequest!: (application: JobApplication) => void;
    mockedService.apply.mockImplementation(
      () =>
        new Promise<JobApplication>((resolve) => {
          finishRequest = resolve;
        }),
    );
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    const button = await findEnabledApplyButton();
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedService.apply).toHaveBeenCalledTimes(1);
    });
    finishRequest(APPLICATION);
    expect(
      await screen.findByRole("dialog", {
        name: "\u00a1Postulaci\u00f3n enviada!",
      }),
    ).toBeInTheDocument();
  });

  it("AC-02.14: shows the apply button again when the prior application was withdrawn", async () => {
    mockedService.getMine.mockResolvedValue({
      hasApplied: false,
      application: null,
    });
    mockedService.apply.mockResolvedValue(APPLICATION);
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());
    expect(
      await screen.findByRole("dialog", {
        name: "\u00a1Postulaci\u00f3n enviada!",
      }),
    ).toBeInTheDocument();
    expect(mockedService.apply).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when the application fails", async () => {
    mockedService.apply.mockRejectedValue(new Error("network"));
    renderWithQuery(<JobApplicationAction jobOfferId="offer-1" />);

    fireEvent.click(await findEnabledApplyButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos enviar tu postulación",
    );
    expect(
      screen.getByRole("button", { name: "Confirmar postulación" }),
    ).toBeEnabled();
  });
});
