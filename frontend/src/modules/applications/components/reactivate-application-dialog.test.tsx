import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { ReactivateApplicationDialog } from "./reactivate-application-dialog";

afterEach(cleanup);

const application = buildApplication({
  status: "Retirada",
  vacancyTitle: "Control de Calidad",
  companyName: "TechBolivia S.R.L.",
});

describe("ReactivateApplicationDialog", () => {
  it("muestra la vacante, empresa y confirmación", () => {
    render(
      <ReactivateApplicationDialog
        application={application}
        isPending={false}
        hasError={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("¿Confirmar nueva postulación?")).toBeInTheDocument();
    expect(screen.getByText("Control de Calidad")).toBeInTheDocument();
    expect(screen.getByText("TechBolivia S.R.L.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar postulación" })).toBeEnabled();
  });

  it("permite cancelar sin confirmar", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ReactivateApplicationDialog
        application={application}
        isPending={false}
        hasError={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it("ejecuta la confirmación solamente al pulsar el botón", () => {
    const onConfirm = vi.fn();

    render(
      <ReactivateApplicationDialog
        application={application}
        isPending={false}
        hasError={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar postulación" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("bloquea los botones mientras se procesa la reactivación", () => {
    render(
      <ReactivateApplicationDialog
        application={application}
        isPending={true}
        hasError={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirmando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("muestra un error si la reactivación falla", () => {
    render(
      <ReactivateApplicationDialog
        application={application}
        isPending={false}
        hasError={true}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo reactivar la postulación",
    );
  });

  it("no muestra el diálogo cuando no hay una postulación seleccionada", () => {
    render(
      <ReactivateApplicationDialog
        application={null}
        isPending={false}
        hasError={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByText("¿Confirmar nueva postulación?")).not.toBeInTheDocument();
  });
});
