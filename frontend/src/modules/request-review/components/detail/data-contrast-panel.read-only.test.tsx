import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReviewDetail, ReviewStatus } from "../../types/request-review.types";
import { DataContrastPanel } from "./data-contrast-panel";

const detail: ReviewDetail = {
  id: "id-1",
  requestCode: "SOL-2026-0001",
  status: "in_review",
  firstName: "José Luis",
  lastName: "Pérez",
  idCardNumber: "1234567",
  idCardIssuedIn: "CB",
  sisCode: "2018001",
  email: "jose@umss.test",
  phone: null,
  birthDate: "2000-05-10",
  graduationYear: 2022,
  career: "Licenciatura en Ingeniería de Sistemas",
  document: null,
  history: { submittedAt: null, openedAt: null, openedBy: null, reviewedAt: null, reviewedBy: null, rejectionReason: null },
};

const FIELD_LABELS = ["Nombres", "Apellidos", "Carnet de identidad", "Código SIS", "Carrera", "Año de titulación"];

describe("DataContrastPanel: solo lectura", () => {
  afterEach(() => cleanup());

  it.each<ReviewStatus>(["rejected", "approved", "pending"])("con estado %s los campos del documento no se pueden editar", (status) => {
    render(<DataContrastPanel detail={{ ...detail, status }} />);

    for (const label of FIELD_LABELS) {
      const input = screen.getByLabelText(label);
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute("readonly");
    }
    expect(screen.getByText("Solo lectura")).toBeInTheDocument();
    expect(screen.queryByText(/por verificar/)).toBeNull();
  });

  it("en revisión los campos siguen editables y muestran los contadores", () => {
    render(<DataContrastPanel detail={detail} />);

    for (const label of FIELD_LABELS) {
      expect(screen.getByLabelText(label)).toBeEnabled();
    }
    expect(screen.queryByText("Solo lectura")).toBeNull();
    expect(screen.getByText("6 por verificar")).toBeInTheDocument();
  });
});
