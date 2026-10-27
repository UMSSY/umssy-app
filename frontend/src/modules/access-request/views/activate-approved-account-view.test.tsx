import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { ActivateApprovedAccountView } from "./activate-approved-account-view";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe("Activación de cuenta aprobada", () => {
  it("pide un enlace válido y no ofrece un formulario sin solicitud", () => {
    render(<ActivateApprovedAccountView requestId="" />);
    expect(screen.getByRole("alert")).toHaveTextContent("correo institucional");
    expect(screen.queryByRole("button", { name: "Activar cuenta" })).not.toBeInTheDocument();
  });

  it("envía código y contraseña una vez, bloquea controles y permite continuar al login", async () => {
    let finish!: (value: unknown) => void;
    const send = vi.spyOn(apiClient, "post").mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<ActivateApprovedAccountView requestId="approved-id" />);
    fireEvent.change(screen.getByLabelText("Código de activación"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "LocalPassword123" } });
    const form = screen.getByRole("button", { name: "Activar cuenta" }).closest("form")!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("/access-requests/approved-id/activate", { code: "123456", password: "LocalPassword123" });
    expect(screen.getByLabelText("Código de activación")).toBeDisabled();
    finish({ data: { data: { activated: true } } });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("vinculada"));
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    expect(screen.queryByLabelText("Contraseña")).not.toBeInTheDocument();
  });

  it("conserva los datos si falla y permite reintentar", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(new Error("red"));
    render(<ActivateApprovedAccountView requestId="approved-id" />);
    fireEvent.change(screen.getByLabelText("Código de activación"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "LocalPassword123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Activar cuenta" }).closest("form")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Comprueba"));
    expect(screen.getByLabelText("Código de activación")).toHaveValue("123456");
    expect(screen.getByRole("button", { name: "Activar cuenta" })).toBeEnabled();
  });
});
