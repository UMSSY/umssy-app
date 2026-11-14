import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SavedCv } from "../types/saved-cv.types";
import { SavedCvCard } from "./saved-cv-card";

function buildCv(index: number, isCurrent = false): SavedCv {
  return {
    id: `cv-${index}`,
    fileName: `CV_Valeria_Quispe_${index}.pdf`,
    fileType: "PDF",
    sizeInBytes: 1258291,
    updatedAt: new Date(2026, 8, 20 - index),
    isCurrent,
  };
}

const CVS = [buildCv(1, true), buildCv(2), buildCv(3)];

function renderCard(props: Partial<Parameters<typeof SavedCvCard>[0]> = {}) {
  const onView = vi.fn();
  const onDelete = vi.fn();
  const onOpenHistory = vi.fn();
  const onRetry = vi.fn();
  render(
    <SavedCvCard
      cvs={CVS}
      totalCvs={CVS.length}
      onView={onView}
      onDelete={onDelete}
      onOpenHistory={onOpenHistory}
      onRetry={onRetry}
      {...props}
    />,
  );
  return { onView, onDelete, onOpenHistory, onRetry, user: userEvent.setup() };
}

describe("SavedCvCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the empty state without saved cvs", () => {
    renderCard({ cvs: [], totalCvs: 0 });

    expect(screen.getByText("CVs guardados")).toBeInTheDocument();
    expect(
      screen.getByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Cargado correctamente")).not.toBeInTheDocument();
  });

  it("treats missing cvs as an empty list", () => {
    renderCard({ cvs: null, totalCvs: undefined });

    expect(
      screen.getByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).toBeInTheDocument();
  });

  it("lists the recent cvs with the current one flagged", () => {
    renderCard();

    const items = within(screen.getByRole("list", { name: "CVs recientes" })).getAllByRole(
      "listitem",
    );

    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText("CV_Valeria_Quispe_1.pdf")).toBeInTheDocument();
    expect(within(items[0]).getByText("Vigente")).toBeInTheDocument();
    expect(within(items[1]).queryByText("Vigente")).not.toBeInTheDocument();
    expect(screen.getByText("El CV más reciente es el vigente en tu perfil.")).toBeInTheDocument();
  });

  it("does not keep a permanent uploaded indicator next to the list", () => {
    renderCard();

    expect(screen.queryByText("Cargado correctamente")).not.toBeInTheDocument();
  });

  it("shows the load error with a retry instead of the empty state", async () => {
    const { onRetry, user } = renderCard({ cvs: [], totalCvs: 0, loadError: "No se pudo cargar tu CV." });

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar tu CV.");
    expect(
      screen.queryByText("Al confirmar la carga, el archivo se mostrará aquí."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("disables the retry while the cvs are reloading", () => {
    renderCard({ cvs: [], totalCvs: 0, loadError: "No se pudo cargar tu CV.", isReloading: true });

    expect(screen.getByRole("button", { name: "Reintentando..." })).toBeDisabled();
  });

  it("keeps showing the loaded cvs when only a reload fails", () => {
    renderCard({ loadError: "No se pudo cargar tu CV." });

    expect(screen.getByRole("list", { name: "CVs recientes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("asks to delete the chosen cv", async () => {
    const { onDelete, user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Eliminar CV_Valeria_Quispe_2.pdf" }));

    expect(onDelete).toHaveBeenCalledWith(CVS[1]);
  });

  it("opens the chosen cv", async () => {
    const { onView, user } = renderCard();

    await user.click(screen.getByRole("button", { name: "Ver CV_Valeria_Quispe_3.pdf" }));

    expect(onView).toHaveBeenCalledWith(CVS[2]);
  });

  it("disables the actions while a cv is opening", () => {
    renderCard({ openingCvId: "cv-1" });

    expect(screen.getByRole("button", { name: "Ver CV_Valeria_Quispe_1.pdf" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eliminar CV_Valeria_Quispe_2.pdf" })).toBeDisabled();
  });

  it("hides the history button with five cvs or fewer", () => {
    renderCard({ totalCvs: 5 });

    expect(screen.queryByRole("button", { name: /Ver historial/ })).not.toBeInTheDocument();
  });

  it("opens the history when there are more than five cvs", async () => {
    const { onOpenHistory, user } = renderCard({ totalCvs: 8 });

    await user.click(screen.getByRole("button", { name: "Ver historial (8)" }));

    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it("shows a loading placeholder instead of the list while the cvs load", () => {
    renderCard({ isLoading: true });

    expect(screen.getByText("Cargando tu CV...")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("disables the delete actions while busy", () => {
    renderCard({ isBusy: true });

    for (const button of screen.getAllByRole("button", { name: /^Eliminar / })) {
      expect(button).toBeDisabled();
    }
  });
});
