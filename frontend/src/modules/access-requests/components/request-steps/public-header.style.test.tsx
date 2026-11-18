import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessRequestProvider } from "../../contexts/access-request-context";
import { PersonalDataForm } from "../personal-data/personal-data-form";
import { PublicHeader } from "./public-header";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderPage() {
  return render(
    <AccessRequestProvider>
      <PublicHeader />
      <PersonalDataForm />
    </AccessRequestProvider>,
  );
}

describe("PublicHeader: estilo del sitio público", () => {
  beforeEach(() => push.mockReset());
  afterEach(() => cleanup());

  it("usa la franja oscura fija y el logo enlaza al inicio", () => {
    renderPage();

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "top-0", "bg-ink", "h-app-header");
    expect(within(header).getByRole("link", { name: "Ir al inicio de UMSSY" })).toHaveAttribute("href", "/");
  });

  it("en celular oculta la pregunta y deja visible Iniciar sesión", () => {
    renderPage();

    expect(screen.getByText("¿Ya tienes cuenta?")).toHaveClass("hidden", "sm:inline");
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).not.toHaveClass("hidden");
  });

  it("con datos, el logo también pide confirmación y Salir lleva al inicio", async () => {
    const user = userEvent.setup();
    renderPage();
    fireEvent.change(screen.getByLabelText(/^Nombres/), { target: { value: "Ana" } });

    await user.click(screen.getByRole("link", { name: "Ir al inicio de UMSSY" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Salir" }));

    expect(push).toHaveBeenCalledWith("/");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("cancelar desde el logo no navega", async () => {
    const user = userEvent.setup();
    renderPage();
    fireEvent.change(screen.getByLabelText(/^Nombres/), { target: { value: "Ana" } });

    await user.click(screen.getByRole("link", { name: "Ir al inicio de UMSSY" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });
});
