import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { REQUEST_REVIEW_QUERY_KEYS } from "../../constants/request-review-query-keys.constants";
import { automaticValidationService } from "../../services/automatic-validation.service";
import type { ValidationDetail } from "../../types/automatic-validation.types";
import type { ReviewApiResult, ReviewDetail } from "../../types/request-review.types";
import { AutomaticValidationPanel } from "./automatic-validation-panel";
import { RequestTimeline } from "./request-timeline";
import { RevertApprovalPanel } from "./revert-approval-panel";

const revertApproval = vi.spyOn(automaticValidationService, "revertApproval");
const getRequestHistory = vi.spyOn(automaticValidationService, "getRequestHistory");

const VALIDATION: ValidationDetail = {
  result: "auto_approved",
  matchScore: 98,
  reason: null,
  readAt: "2026-10-24T13:21:00.000Z",
  revertedAt: null,
  revertedBy: null,
  fields: [
    { field: "fullName", declared: "María Quispe Mamani", read: "MARIA QUISPE MAMANI", result: "match" },
    { field: "career", declared: "Licenciatura en Ingeniería de Sistemas", read: "Ingeniería Civil", result: "mismatch" },
    { field: "graduationYear", declared: "2019", read: "2019", result: "match" },
    { field: "idCardNumber", declared: "1234567", read: null, result: "not_compared" },
    { field: "sisCode", declared: "201502277", read: null, result: "not_compared" },
  ],
};

const detail = (overrides: Partial<ReviewDetail> = {}): ReviewDetail => ({
  id: "req-1",
  requestCode: "SOL-2026-0141",
  status: "approved",
  firstName: "María",
  lastName: "Quispe Mamani",
  idCardNumber: "1234567",
  idCardIssuedIn: "CB",
  sisCode: "201502277",
  email: "maria@umss.test",
  phone: null,
  birthDate: "1997-03-02",
  graduationYear: 2019,
  career: "Licenciatura en Ingeniería de Sistemas",
  document: null,
  history: { submittedAt: "2026-10-24T13:20:00.000Z", openedAt: null, openedBy: null, reviewedAt: null, reviewedBy: null, rejectionReason: null },
  validation: VALIDATION,
  ...overrides,
});

beforeEach(() => {
  revertApproval.mockReset();
  getRequestHistory.mockReset();
});
afterEach(() => cleanup());

describe("AutomaticValidationPanel", () => {
  it("CA5 y CA6: muestra el resultado de cada dato y marca Carnet y Código SIS como No se compara", () => {
    renderWithQuery(<AutomaticValidationPanel detail={detail()} />);

    const panel = screen.getByRole("region", { name: "Validación automática" });
    expect(within(panel).getByText("Aprobada automáticamente")).toBeInTheDocument();
    expect(within(panel).getByRole("meter", { name: "Coincidencia 98%" })).toBeInTheDocument();
    const rows = within(panel).getAllByRole("row").slice(1).map((row) => row.textContent);
    expect(rows[0]).toContain("Nombre completo");
    expect(rows[0]).toContain("Coincide");
    expect(rows[1]).toContain("No coincide");
    expect(rows[3]).toContain("Carnet de identidad");
    expect(rows[3]).toContain("No se compara");
    expect(rows[4]).toContain("No se compara");
  });

  it("CA9: mientras está en cola indica la lectura OCR pendiente", () => {
    renderWithQuery(<AutomaticValidationPanel detail={detail({ status: "pending", validation: { ...VALIDATION, result: "queued", matchScore: null, fields: [] } })} />);
    expect(screen.getAllByText(/En cola de lectura OCR/).length).toBeGreaterThan(0);
    expect(screen.getByText("Sin validar")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("indica quién revirtió la aprobación y no muestra nada sin validación", () => {
    const { container } = renderWithQuery(
      <>
        <AutomaticValidationPanel detail={detail({ status: "in_review", validation: { ...VALIDATION, result: "manual_review", revertedBy: "Carla Montaño" } })} />
        <AutomaticValidationPanel detail={detail({ validation: null })} />
      </>,
    );
    expect(screen.getByText("Aprobación revertida por Carla Montaño.")).toBeInTheDocument();
    expect(container.querySelectorAll("section")).toHaveLength(1);
  });
});

describe("RevertApprovalPanel", () => {
  it("solo aparece en aprobaciones automáticas", () => {
    const { container } = renderWithQuery(
      <>
        <RevertApprovalPanel detail={detail({ validation: { ...VALIDATION, result: "manual_review" } })} />
        <RevertApprovalPanel detail={detail({ status: "in_review" })} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("CA7: confirma, revierte y avisa que volvió a revisión manual", async () => {
    revertApproval.mockResolvedValue({ ok: true, data: { id: "req-1", status: "in_review" } });
    renderWithQuery(<RevertApprovalPanel detail={detail()} />);

    fireEvent.click(screen.getByRole("button", { name: "Revertir aprobación" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Revertir aprobación" }));

    await waitFor(() => expect(revertApproval).toHaveBeenCalledWith("req-1"));
    expect(await screen.findByRole("status")).toHaveTextContent("La aprobación se revirtió. La solicitud volvió a revisión manual.");
  });

  it("muestra el motivo si no se puede revertir", async () => {
    revertApproval.mockResolvedValue({ ok: false, status: 409, message: "La persona titulada ya activó su cuenta; la aprobación no se puede revertir" });
    renderWithQuery(<RevertApprovalPanel detail={detail()} />);

    fireEvent.click(screen.getByRole("button", { name: "Revertir aprobación" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Revertir aprobación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("ya activó su cuenta");
  });

  it("al revertir refresca el detalle, la bandeja y el historial de la solicitud", async () => {
    revertApproval.mockResolvedValue({ ok: true, data: { id: "req-1", status: "in_review" } });
    const { client } = renderWithQuery(<RevertApprovalPanel detail={detail()} />);
    const invalidate = vi.spyOn(client, "invalidateQueries");

    fireEvent.click(screen.getByRole("button", { name: "Revertir aprobación" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Revertir aprobación" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: REQUEST_REVIEW_QUERY_KEYS.detail("req-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: REQUEST_REVIEW_QUERY_KEYS.inbox });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: REQUEST_REVIEW_QUERY_KEYS.history("req-1") });
  });

  it("mientras revierte bloquea los controles y no envía la operación dos veces", async () => {
    let finish!: (result: ReviewApiResult<{ id: string; status: "in_review" }>) => void;
    revertApproval.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    renderWithQuery(<RevertApprovalPanel detail={detail()} />);

    fireEvent.click(screen.getByRole("button", { name: "Revertir aprobación" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Revertir aprobación" }));

    const pending = await screen.findByRole("button", { name: "Revirtiendo..." });
    expect(pending).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    fireEvent.click(pending);
    expect(revertApproval).toHaveBeenCalledTimes(1);

    finish({ ok: true, data: { id: "req-1", status: "in_review" } });
    expect(await screen.findByRole("status")).toHaveTextContent("volvió a revisión manual");
  });

  it("tras un error de conexión permite reintentar y limpia el aviso al lograrlo", async () => {
    revertApproval
      .mockResolvedValueOnce({ ok: false, status: 0, message: "No se pudo conectar con el servidor. Inténtalo de nuevo." })
      .mockResolvedValueOnce({ ok: true, data: { id: "req-1", status: "in_review" } });
    renderWithQuery(<RevertApprovalPanel detail={detail()} />);

    fireEvent.click(screen.getByRole("button", { name: "Revertir aprobación" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Revertir aprobación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Revertir aprobación" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Revertir aprobación" }));

    expect(await screen.findByRole("status")).toHaveTextContent("volvió a revisión manual");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(revertApproval).toHaveBeenCalledTimes(2);
  });
});

describe("RequestTimeline", () => {
  it("CA11: lista los eventos con fecha y si actuó el Solicitante, el Sistema o un administrativo", async () => {
    getRequestHistory.mockResolvedValue({
      ok: true,
      data: [
        { id: "1", action: "submitted", occurredAt: "2026-10-24T13:20:00.000Z", actorName: "María Quispe", actorRole: "titulado", detail: null },
        { id: "2", action: "ocr_read", occurredAt: "2026-10-24T13:21:00.000Z", actorName: "Sistema", actorRole: "sistema", detail: "Lectura OCR completada: 98% de coincidencia con los datos declarados." },
        { id: "3", action: "approved", occurredAt: "2026-10-24T13:21:00.000Z", actorName: "Sistema", actorRole: "sistema", detail: null },
        { id: "4", action: "activation_code_sent", occurredAt: "2026-10-24T13:22:00.000Z", actorName: "Sistema", actorRole: "sistema", detail: null },
        { id: "5", action: "approval_reverted", occurredAt: "2026-10-24T14:00:00.000Z", actorName: "Carla Montaño", actorRole: "administrativo", detail: null },
      ],
    });
    renderWithQuery(<RequestTimeline detail={detail()} />);

    expect(await screen.findByText("Solicitud enviada")).toBeInTheDocument();
    expect(screen.getByText("Lectura OCR")).toBeInTheDocument();
    expect(screen.getByText("Decisión tomada: aprobada")).toBeInTheDocument();
    expect(screen.getByText("Código enviado")).toBeInTheDocument();
    expect(screen.getByText(/^Solicitante ·/)).toBeInTheDocument();
    expect(screen.getAllByText(/^Sistema ·/)).toHaveLength(3);
    expect(screen.getByText(/^Carla Montaño ·/)).toBeInTheDocument();
  });

  it("sin eventos registrados mantiene el historial resumido", async () => {
    getRequestHistory.mockResolvedValue({ ok: true, data: [] });
    renderWithQuery(<RequestTimeline detail={detail()} />);
    expect(await screen.findByText("Solicitud enviada por la persona titulada")).toBeInTheDocument();
  });
});
