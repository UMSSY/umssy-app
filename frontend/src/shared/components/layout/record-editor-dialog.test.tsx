import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordEditorDialog } from "./record-editor-dialog";

function EditorFixture({ isBusy = false, hasUnsavedChanges = false }: { isBusy?: boolean; hasUnsavedChanges?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);
  return isOpen ? <RecordEditorDialog title="Editar formación" description="Actualiza este registro." isBusy={isBusy} hasUnsavedChanges={hasUnsavedChanges} onClose={() => setIsOpen(false)}>{(requestClose) => <><Input aria-label="Descripción" defaultValue="Original" /><Button onClick={requestClose}>Cancelar</Button></>}</RecordEditorDialog> : <p>Editor cerrado</p>;
}

afterEach(cleanup);
describe("Record editor", () => {
  it("closes a pristine form without an unnecessary confirmation", async () => {
    const user = userEvent.setup(); render(<EditorFixture />);
    await user.click(screen.getByRole("button", { name: "Cerrar formulario" }));
    expect(screen.getByText("Editor cerrado")).toBeInTheDocument();
  });

  it("preserves entered data when the user decides to continue editing", async () => {
    const user = userEvent.setup(); render(<EditorFixture />);
    await user.type(screen.getByRole("textbox"), " modificado");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("¿Descartar los cambios?");
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.getByRole("textbox")).toHaveValue("Original modificado");
  });

  it("confirms discarding after Escape and only then closes", async () => {
    const user = userEvent.setup(); render(<EditorFixture hasUnsavedChanges />);
    await user.keyboard("{Escape}");
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Descartar cambios" }));
    expect(screen.getByText("Editor cerrado")).toBeInTheDocument();
  });

  it("does not allow closing while a request is pending", async () => {
    const user = userEvent.setup(); render(<EditorFixture isBusy />);
    expect(screen.getByRole("button", { name: "Cerrar formulario" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
