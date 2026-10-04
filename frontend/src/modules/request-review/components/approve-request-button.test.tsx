import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { requestReviewService } from "../services/request-review.service";
import { ApproveRequestButton } from "./approve-request-button";

vi.mock("../services/request-review.service", () => ({
  requestReviewService: { approveRequest: vi.fn() },
}));

const approveRequestMock = vi.mocked(requestReviewService.approveRequest);

function buildAxiosError(status: number) {
  return new AxiosError("error", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
  } as AxiosResponse);
}

function renderButton(status: "IN_REVIEW" | "PENDING" | "APPROVED" = "IN_REVIEW") {
  const onApproved = vi.fn();
  render(
    <ApproveRequestButton
      requestId="abc-123"
      status={status}
      applicantEmail="titulado@umss.edu"
      onApproved={onApproved}
    />,
  );
  return { onApproved };
}

describe("ApproveRequestButton", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the current status and the approve button", () => {
    renderButton();
    expect(screen.getByText("En revisión")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprobar solicitud" })).toBeEnabled();
  });

  it("disables the button when the request is not in review", () => {
    renderButton("PENDING");
    expect(screen.getByRole("button", { name: "Aprobar solicitud" })).toBeDisabled();
  });

  it("asks for confirmation before approving", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Aprobar solicitud" }));

    expect(await screen.findByText(/se enviará el código de activación/i)).toBeInTheDocument();
    expect(screen.getByText("titulado@umss.edu")).toBeInTheDocument();
    expect(approveRequestMock).not.toHaveBeenCalled();
  });

  it("does not approve when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Aprobar solicitud" }));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(approveRequestMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("En revisión")).toBeInTheDocument();
  });

  it("changes the status to Aprobada and reports the sent code after confirming", async () => {
    approveRequestMock.mockResolvedValue({ id: "abc-123", status: "APPROVED" });
    const user = userEvent.setup();
    const { onApproved } = renderButton();

    await user.click(screen.getByRole("button", { name: "Aprobar solicitud" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar aprobación" }));

    expect(approveRequestMock).toHaveBeenCalledWith("abc-123");
    expect(await screen.findByText("Aprobada")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Se envió el código de activación a titulado@umss.edu",
    );
    expect(screen.queryByRole("button", { name: "Aprobar solicitud" })).not.toBeInTheDocument();
    expect(onApproved).toHaveBeenCalledWith({ id: "abc-123", status: "APPROVED" });
  });

  it("shows a message in Spanish when the request is no longer in review", async () => {
    approveRequestMock.mockRejectedValue(buildAxiosError(409));
    const user = userEvent.setup();
    const { onApproved } = renderButton();

    await user.click(screen.getByRole("button", { name: "Aprobar solicitud" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar aprobación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La solicitud ya no está en revisión",
    );
    expect(screen.getByText("En revisión")).toBeInTheDocument();
    expect(onApproved).not.toHaveBeenCalled();
  });

  it.each([
    [403, "No tienes permiso para aprobar solicitudes."],
    [404, "La solicitud ya no existe."],
    [500, "No se pudo aprobar la solicitud."],
  ])("maps the %i error to a message in Spanish", async (status, message) => {
    approveRequestMock.mockRejectedValue(buildAxiosError(status));
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Aprobar solicitud" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar aprobación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("shows the generic message for a non network error", async () => {
    approveRequestMock.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: "Aprobar solicitud" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar aprobación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo aprobar la solicitud.",
    );
  });
});
