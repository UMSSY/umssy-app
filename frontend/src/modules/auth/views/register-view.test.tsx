import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { apiClient } from "@/shared/services/api-client";
import { RegisterView } from "./register-view";

vi.mock("@/shared/services/api-client", () => ({ apiClient: { post: vi.fn() } }));

function completeForm(confirmPassword = "Prueba123") {
  fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Perez" } });
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "ana@example.com" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Prueba123" } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: confirmPassword } });
  fireEvent.submit(screen.getByRole("button", { name: "Crear cuenta" }).closest("form")!);
}

describe("RegisterView", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(cleanup);

  it("crea la cuenta y ofrece iniciar sesión", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { id: "new-user" } } });
    render(<RegisterView />);
    completeForm();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Tu cuenta está creada"));
    expect(apiClient.post).toHaveBeenCalledWith("/auth/register", expect.objectContaining({ roleTag: "estudiante", password: "Prueba123" }));
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
  });

  it("no envía contraseñas diferentes", () => {
    render(<RegisterView />);
    completeForm("OtraClave123");
    expect(screen.getByRole("alert")).toHaveTextContent("Las contraseñas no coinciden");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("muestra un error si el correo ya existe", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ isAxiosError: true, response: { status: 409 } });
    render(<RegisterView />);
    completeForm();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Ya existe una cuenta"));
  });
});
