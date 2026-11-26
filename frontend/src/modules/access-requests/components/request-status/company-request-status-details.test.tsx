import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CompanyRequestStatusResponse } from "../../types/company-request-status.types";
import { CompanyRequestStatusDetails } from "./company-request-status-details";

const BASE: CompanyRequestStatusResponse = {
  requestCode: "EMP-2026-0001",
  companyName: "Tech Andina",
  status: "OBSERVED",
  submittedAt: "2026-11-16T15:00:00.000Z",
  reviewedAt: "2026-11-17T15:00:00.000Z",
  rejectionReason: null,
  reason: "[Documento] Carta ilegible\nSube el PDF original.",
  canResubmit: true,
};

describe("CompanyRequestStatusDetails", () => {
  afterEach(cleanup);

  it("muestra el estado, los datos y el motivo de una solicitud observada", () => {
    render(<CompanyRequestStatusDetails request={BASE} onStartCorrection={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Estado: Necesitamos una corrección");
    expect(screen.getByText("EMP-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Tech Andina")).toBeInTheDocument();
    expect(screen.getByText("Fecha de revisión")).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo de la revisión")).toHaveTextContent("Motivo: [Documento] Carta ilegible");
    expect(screen.getByText("Sube el PDF original.")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Antes de volver a subirlo" })).toBeInTheDocument();
  });

  it("una solicitud rechazada reabrible ofrece subir otro documento", async () => {
    const onStartCorrection = vi.fn();
    render(
      <CompanyRequestStatusDetails
        request={{ ...BASE, status: "REJECTED", rejectionReason: "Firma no válida", reason: "Firma no válida" }}
        onStartCorrection={onStartCorrection}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Estado: Necesitamos otro documento");
    await userEvent.click(screen.getByRole("button", { name: "Subir un nuevo documento" }));
    expect(onStartCorrection).toHaveBeenCalledOnce();
  });

  it("sin el enlace del correo explica cómo corregir y deshabilita el botón", () => {
    render(<CompanyRequestStatusDetails request={BASE} />);

    expect(screen.getByRole("button", { name: "Subir un nuevo documento" })).toBeDisabled();
    expect(screen.getByText("Para corregir el documento, abre el enlace de tu correo de revisión.")).toBeInTheDocument();
  });

  it.each([
    ["PENDING", "En revisión"],
    ["IN_REVIEW", "En revisión"],
    ["APPROVED", "Aprobada"],
    ["DRAFT", "Borrador"],
    ["OTRO", "Estado no disponible"],
  ])("el estado %s no ofrece correcciones ni motivo", (status, label) => {
    render(
      <CompanyRequestStatusDetails
        request={{ ...BASE, status, canResubmit: false, reason: null, reviewedAt: null, requestCode: null, submittedAt: null }}
        onStartCorrection={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(`Estado: ${label}`);
    expect(screen.queryByRole("button", { name: "Subir un nuevo documento" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo de la revisión")).not.toBeInTheDocument();
    expect(screen.getByText("Sin código")).toBeInTheDocument();
    expect(screen.getByText("Fecha no disponible")).toBeInTheDocument();
  });
});
