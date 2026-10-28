import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReviewListItem } from "../../types/request-review.types";
import { getAutomationState } from "../../utils/get-automation-state";
import { AutomationStatus } from "./automation-status";
import { AutomationSummaryCards } from "./automation-summary-cards";
import { MatchScoreBar } from "./match-score-bar";
import { RequestTable } from "./request-table";

afterEach(() => cleanup());

describe("getAutomationState", () => {
  it("traduce el estado y el resultado automático en lo que muestra la bandeja", () => {
    expect(getAutomationState("pending", { result: "queued", matchScore: null, reason: null })).toEqual({ key: "queued", label: "Pendiente", description: "En cola de lectura OCR" });
    expect(getAutomationState("approved", { result: "auto_approved", matchScore: 98, reason: null })?.label).toBe("Aprobada automáticamente");
    expect(getAutomationState("rejected", { result: "auto_rejected", matchScore: 12, reason: "El archivo no es un diploma" })?.description).toBe("El archivo no es un diploma");
    expect(getAutomationState("in_review", { result: "manual_review", matchScore: 61, reason: "El apellido no coincide" })?.label).toBe("Revisión manual");
  });

  it("sin validación o con un dictamen humano posterior usa el estado normal", () => {
    expect(getAutomationState("pending", null)).toBeNull();
    expect(getAutomationState("approved", { result: "manual_review", matchScore: 61, reason: null })).toBeNull();
  });
});

describe("AutomationStatus y MatchScoreBar", () => {
  it("CA3, CA4 y CA9: muestran el estado automático con su motivo", () => {
    render(
      <>
        <AutomationStatus status="pending" validation={{ result: "queued", matchScore: null, reason: null }} />
        <AutomationStatus status="pending" validation={{ result: "manual_review", matchScore: 48, reason: "Documento poco legible" }} />
        <AutomationStatus status="rejected" validation={{ result: "auto_rejected", matchScore: 12, reason: "El archivo no es un diploma" }} />
        <AutomationStatus status="approved" />
      </>,
    );
    expect(screen.getByText("En cola de lectura OCR")).toBeInTheDocument();
    expect(screen.getByText("Documento poco legible")).toBeInTheDocument();
    expect(screen.getByText("Rechazada automáticamente")).toBeInTheDocument();
    expect(screen.getByText("El archivo no es un diploma")).toBeInTheDocument();
    expect(screen.getByText("Aprobada")).toBeInTheDocument();
  });

  it("la barra muestra el porcentaje o Sin validar", () => {
    render(
      <>
        <MatchScoreBar validation={{ result: "auto_approved", matchScore: 98, reason: null }} />
        <MatchScoreBar validation={{ result: "queued", matchScore: null, reason: null }} />
      </>,
    );
    expect(screen.getByRole("meter", { name: "Coincidencia 98%" })).toHaveAttribute("aria-valuenow", "98");
    expect(screen.getByText("Sin validar")).toBeInTheDocument();
  });

  it("la tabla agrega la columna Coincidencia con el estado automático", () => {
    const item: ReviewListItem = {
      id: "id-1",
      requestCode: "SOL-1",
      fullName: "María Quispe Mamani",
      email: "maria@umss.test",
      sisCode: "201502277",
      career: "Licenciatura en Ingeniería de Sistemas",
      documentType: "academic_diploma",
      submittedAt: new Date().toISOString(),
      status: "approved",
      validation: { result: "auto_approved", matchScore: 98, reason: null },
    };
    render(<RequestTable items={[item]} />);
    expect(screen.getByRole("columnheader", { name: "Coincidencia" })).toBeInTheDocument();
    expect(screen.getByText("Aprobada automáticamente")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
  });
});

describe("AutomationSummaryCards", () => {
  const automation = { manualReviewCount: 5, autoApprovedTodayCount: 12, autoRejectedTodayCount: 1, receivedTodayCount: 17 };
  const inbox = {
    pendingCount: 5,
    pendingOver24hCount: 2,
    decidedTodayCount: 13,
    approvedTodayCount: 12,
    rejectedTodayCount: 1,
    averageReviewHours: 6,
    reviewTimeGoalHours: 48,
    rejectedThisMonthCount: 3,
    topRejectionReason: null,
  };

  it("CA10: muestra los contadores de revisión manual y de dictámenes automáticos de hoy", () => {
    render(<AutomationSummaryCards automation={automation} inbox={inbox} isLoading={false} error={null} onRetry={vi.fn()} />);
    expect(screen.getByText("Requieren revisión manual").nextSibling).toHaveTextContent("5");
    expect(screen.getByText("2 esperan más de 24 horas")).toBeInTheDocument();
    expect(screen.getByText("Aprobadas automáticamente hoy").nextSibling).toHaveTextContent("12");
    expect(screen.getByText("de 17 solicitudes recibidas")).toBeInTheDocument();
    expect(screen.getByText("Rechazadas automáticamente hoy").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("6 h")).toBeInTheDocument();
  });

  it("muestra esqueletos al cargar y Reintentar ante un error", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<AutomationSummaryCards automation={null} inbox={null} isLoading error={null} onRetry={onRetry} />);
    expect(screen.getByTestId("automation-summary-skeleton")).toBeInTheDocument();
    rerender(<AutomationSummaryCards automation={null} inbox={null} isLoading={false} error="Sin conexión" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("sin espera larga ni tiempo medio muestra textos neutros", () => {
    render(<AutomationSummaryCards automation={automation} inbox={{ ...inbox, pendingOver24hCount: 0, averageReviewHours: null }} isLoading={false} error={null} onRetry={vi.fn()} />);
    expect(screen.getByText("Ninguna espera más de 24 horas")).toBeInTheDocument();
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });
});
