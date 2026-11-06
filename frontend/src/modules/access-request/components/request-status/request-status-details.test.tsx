import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RequestStatusResponse } from "../../types/access-request.types";
import { RequestStatusDetails } from "./request-status-details";

const REJECTED_REQUEST: RequestStatusResponse = {
  requestCode: "SOL-2026-0001",
  status: "rejected",
  fullName: "Ana Pérez",
  submittedAt: "2026-10-05T15:00:00.000Z",
  reviewedAt: "2026-10-06T10:00:00.000Z",
  rejectionReason: "Documento ilegible",
  document: null,
};

describe("RequestStatusDetails", () => {
  afterEach(cleanup);

  it("muestra el estado rechazado, código, nombre y motivo", () => {
    render(<RequestStatusDetails {...REJECTED_REQUEST} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Estado: Necesitamos otro documento",
    );

    expect(
      screen.getByText("SOL-2026-0001"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Ana Pérez"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Motivo del rechazo",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Documento ilegible"),
    ).toBeInTheDocument();
  });

  it.each([
    { status: "draft", label: "Borrador" },
    { status: "pending", label: "En revisión" },
    { status: "in_review", label: "En revisión" },
    { status: "approved", label: "Aprobada" },
  ])(
    "oculta nombre y motivo cuando el estado es $status",
    ({ status, label }) => {
      render(
        <RequestStatusDetails
          {...REJECTED_REQUEST}
          status={status}
        />,
      );

      expect(screen.getByRole("status")).toHaveTextContent(
        `Estado: ${label}`,
      );

      expect(
        screen.queryByText("Ana Pérez"),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByText("Nombre del solicitante"),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole("heading", {
          name: "Motivo del rechazo",
        }),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByText("Documento ilegible"),
      ).not.toBeInTheDocument();
    },
  );

  it("presenta la revisión en una línea compacta y en hora de Bolivia", () => {
    render(<RequestStatusDetails {...REJECTED_REQUEST} />);

    expect(
      screen.getByText(/Revisado por la Secretaría,/),
    ).toHaveTextContent(
      "Revisado por la Secretaría, 6 oct, 06:00",
    );

    expect(
      screen.queryByText("Fecha de envío"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Fecha de revisión"),
    ).not.toBeInTheDocument();
  });

  it.each([undefined, "", "   "])(
    "muestra un aviso cuando el nombre no está disponible: %j",
    (fullName) => {
      render(
        <RequestStatusDetails
          {...REJECTED_REQUEST}
          fullName={fullName}
        />,
      );

      expect(
        screen.getByText("Nombre no disponible"),
      ).toBeInTheDocument();
    },
  );

  it.each([null, "", "   "])(
    "muestra un aviso cuando el motivo no está disponible: %j",
    (rejectionReason) => {
      render(
        <RequestStatusDetails
          {...REJECTED_REQUEST}
          rejectionReason={rejectionReason}
        />,
      );

      expect(
        screen.getByText("No hay un motivo disponible."),
      ).toBeInTheDocument();
    },
  );

  it("contempla fechas ausentes sin inventar una fecha de revisión", () => {
    render(
      <RequestStatusDetails
        {...REJECTED_REQUEST}
        submittedAt={null}
        reviewedAt={null}
      />,
    );

    expect(
      screen.queryByText(/Revisado por la Secretaría,/),
    ).not.toBeInTheDocument();
  });

  it("controla una fecha de revisión inválida", () => {
    render(
      <RequestStatusDetails
        {...REJECTED_REQUEST}
        reviewedAt="fecha-invalida"
      />,
    );

    expect(
      screen.getByText(/Revisado por la Secretaría,/),
    ).toHaveTextContent(
      "Revisado por la Secretaría, Fecha no disponible",
    );
  });

  it("contempla un estado desconocido sin mostrar nombre ni motivo", () => {
    render(
      <RequestStatusDetails
        {...REJECTED_REQUEST}
        status="estado-desconocido"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Estado: Estado no disponible",
    );

    expect(
      screen.queryByText("Ana Pérez"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Documento ilegible"),
    ).not.toBeInTheDocument();
  });

  it("no renderiza otros datos personales que pudiera contener el objeto", () => {
    const forbiddenData = {
      idCardNumber: "CI_INTERNO",
      sisCode: "SIS_INTERNO",
      phone: "TELEFONO_INTERNO",
      email: "privado@ejemplo.com",
      birthDate: "1990-07-12",
      firstName: "NOMBRE_INTERNO",
      lastName: "APELLIDO_INTERNO",
      content: "CONTENIDO_DOCUMENTAL_INTERNO",
    };

    const request = {
      ...REJECTED_REQUEST,
      ...forbiddenData,
    };

    const { container } = render(
      <RequestStatusDetails {...request} />,
    );

    for (const value of Object.values(forbiddenData)) {
      expect(container.innerHTML).not.toContain(value);
    }

    expect(
      screen.getByText("Ana Pérez"),
    ).toBeInTheDocument();
  });

  it("muestra el motivo como texto sin interpretarlo como HTML", () => {
    const reason = "<img src=x onerror=alert(1)>";

    const { container } = render(
      <RequestStatusDetails
        {...REJECTED_REQUEST}
        rejectionReason={reason}
      />,
    );

    expect(screen.getByText(reason)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("muestra el botón de corrección deshabilitado cuando no existe una acción de F2", () => {
    render(<RequestStatusDetails {...REJECTED_REQUEST} />);

    const button = screen.getByRole("button", {
      name: "Subir un nuevo documento",
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("type", "button");
  });

  it("ejecuta la acción proporcionada al iniciar la corrección de una solicitud rechazada", async () => {
    const user = userEvent.setup();
    const onStartCorrection = vi.fn();

    render(
      <RequestStatusDetails
        {...REJECTED_REQUEST}
        onStartCorrection={onStartCorrection}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Subir un nuevo documento",
    });

    expect(button).toBeEnabled();
    expect(onStartCorrection).not.toHaveBeenCalled();

    await user.click(button);

    expect(onStartCorrection).toHaveBeenCalledTimes(1);
  });

  it.each([
    "draft",
    "pending",
    "in_review",
    "approved",
    "estado-desconocido",
  ])(
    "no ofrece la corrección cuando el estado es %s aunque reciba una acción",
    (status) => {
      const onStartCorrection = vi.fn();

      render(
        <RequestStatusDetails
          {...REJECTED_REQUEST}
          status={status}
          onStartCorrection={onStartCorrection}
        />,
      );

      expect(
        screen.queryByRole("button", {
          name: "Subir un nuevo documento",
        }),
      ).not.toBeInTheDocument();

      expect(onStartCorrection).not.toHaveBeenCalled();
    },
  );
});