import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SavedCv } from "../types/saved-cv.types";
import { DeleteCvDialog } from "./delete-cv-dialog";

const CV: SavedCv = {
  id: "cv-1",
  fileName: "CV_Valeria_Quispe.pdf",
  fileType: "PDF",
  sizeInBytes: 1258291,
  updatedAt: new Date(2026, 8, 20),
  isCurrent: false,
};

function renderDialog(props: Partial<Parameters<typeof DeleteCvDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <DeleteCvDialog
      cv={CV}
      hasOtherCvs
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel, user: userEvent.setup() };
}

describe("DeleteCvDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("is closed without a cv to delete", () => {
    renderDialog({ cv: null });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("tells that an older cv only leaves the history", async () => {
    renderDialog();

    expect(
      await screen.findByRole("alertdialog", { name: "¿Eliminar este CV?" }),
    ).toHaveAccessibleDescription("CV_Valeria_Quispe.pdf se eliminará de tu historial de CVs.");
  });

  it("warns that the previous cv becomes current when deleting the current one", async () => {
    renderDialog({ cv: { ...CV, isCurrent: true } });

    expect(await screen.findByRole("alertdialog")).toHaveAccessibleDescription(
      "CV_Valeria_Quispe.pdf dejará de estar disponible en tu perfil. Tu CV anterior más reciente pasará a ser el vigente.",
    );
  });

  it("does not warn about a next current cv when it is the only one", async () => {
    renderDialog({ cv: { ...CV, isCurrent: true }, hasOtherCvs: false });

    expect(await screen.findByRole("alertdialog")).toHaveAccessibleDescription(
      "CV_Valeria_Quispe.pdf dejará de estar disponible en tu perfil.",
    );
  });

  it("uses a generic name when the file name is blank", async () => {
    renderDialog({ cv: { ...CV, fileName: "  " } });

    expect(await screen.findByRole("alertdialog")).toHaveAccessibleDescription(
      "El archivo se eliminará de tu historial de CVs.",
    );
  });

  it("confirms the deletion with the cv", async () => {
    const { onConfirm, user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    expect(onConfirm).toHaveBeenCalledWith(CV);
  });

  it("cancels the deletion", async () => {
    const { onCancel, onConfirm, user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
