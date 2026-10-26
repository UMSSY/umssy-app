import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildJobOffer } from "../testing/vacancy-fixtures";
import { VacancyCard } from "./vacancy-card";

function renderCard(props: Partial<Parameters<typeof VacancyCard>[0]> = {}) {
  return render(
    <ul>
      <VacancyCard offer={buildJobOffer()} onDetails={vi.fn()} {...props} />
    </ul>,
  );
}

describe("VacancyCard", () => {
  afterEach(() => cleanup());

  it("muestra los datos obligatorios de la vacante", () => {
    renderCard({ offer: buildJobOffer({ applicantsCount: 12 }) });

    expect(screen.getByRole("button", { name: "Desarrolladora Frontend" })).toBeInTheDocument();
    expect(screen.getByText(/Publicado: 12\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Modalidad: Remoto/)).toBeInTheDocument();
    expect(screen.getByText(/Postulantes: 12 candidatos/)).toBeInTheDocument();
    expect(screen.getByText("Tipo de contrato: Tiempo completo")).toBeInTheDocument();
  });

  it("no muestra la etiqueta de estado por defecto", () => {
    renderCard();

    expect(screen.queryByText("Activa")).not.toBeInTheDocument();
  });

  it.each([
    ["Publicada", "Activa", "bg-green-100"],
    ["Cerrada", "Cerrada", "bg-muted"],
    ["Eliminada", "Eliminada", "bg-destructive/10"],
  ])("muestra la etiqueta del estado %s", (status, label, colorClass) => {
    renderCard({ offer: buildJobOffer({ status }), showStatus: true });

    expect(screen.getByText(label)).toHaveClass(colorClass);
  });

  it("en una vacante activa mantiene ver postulantes, editar y eliminar", () => {
    renderCard({ offer: buildJobOffer({ id: "offer-9" }), showStatus: true });

    expect(screen.getByRole("link", { name: "Ver postulantes" })).toHaveAttribute("href", "/matching?vacancyId=offer-9");
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/recruiters/job-offers/offer-9/edit",
    );
    expect(
      screen.getByRole("button", { name: "Eliminar vacante Desarrolladora Frontend" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reabrir" })).not.toBeInTheDocument();
  });

  it("en una vacante cerrada muestra Reabrir como único botón de acción", () => {
    renderCard({ offer: buildJobOffer({ status: "Cerrada" }), showStatus: true });

    expect(screen.getByRole("button", { name: "Reabrir" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver postulantes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar vacante/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Desarrolladora Frontend",
      "Reabrir",
    ]);
  });

  it("deshabilita Reabrir mientras no exista una acción conectada", () => {
    renderCard({ offer: buildJobOffer({ status: "Cerrada" }) });

    expect(screen.getByRole("button", { name: "Reabrir" })).toBeDisabled();
  });

  it("notifica el identificador de la vacante al pulsar Reabrir", async () => {
    const user = userEvent.setup();
    const onReopen = vi.fn();
    renderCard({ offer: buildJobOffer({ id: "closed-1", status: "Cerrada" }), onReopen });

    await user.click(screen.getByRole("button", { name: "Reabrir" }));

    expect(onReopen).toHaveBeenCalledWith("closed-1");
  });

  it("en una vacante eliminada no ofrece ninguna acción de gestión", () => {
    renderCard({ offer: buildJobOffer({ status: "Eliminada" }), showStatus: true });

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Desarrolladora Frontend",
    ]);
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("atenúa visualmente la tarjeta de una vacante eliminada", () => {
    renderCard({ offer: buildJobOffer({ status: "Eliminada" }), showStatus: true });

    expect(screen.getByRole("listitem")).toHaveClass("bg-destructive/10");
  });

  it("abre los detalles al pulsar el título", async () => {
    const user = userEvent.setup();
    const onDetails = vi.fn();
    renderCard({ offer: buildJobOffer({ id: "offer-3" }), onDetails });

    await user.click(screen.getByRole("button", { name: "Desarrolladora Frontend" }));

    expect(onDetails).toHaveBeenCalledWith("offer-3");
  });
});