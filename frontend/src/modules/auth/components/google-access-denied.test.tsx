import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleAccessDenied } from "./google-access-denied";

vi.mock("@/shared/components/layout/brand-logo", () => ({ BrandLogo: () => <span>UMSSY</span> }));

describe("GoogleAccessDenied", () => {
  afterEach(cleanup);

  it("cuenta no registrada: muestra el mensaje del servidor y ofrece otra cuenta o volver", async () => {
    const onRetryGoogle = vi.fn();
    const onBackToLogin = vi.fn();
    render(
      <GoogleAccessDenied
        denied={{ reason: "not_registered", message: "Tu solicitud aún no fue aprobada" }}
        onRetryGoogle={onRetryGoogle}
        onBackToLogin={onBackToLogin}
      />,
    );

    expect(screen.getByText("Tu solicitud aún no fue aprobada")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /probar con otra cuenta/i }));
    await userEvent.click(screen.getByRole("button", { name: "Volver a iniciar sesión" }));
    expect(onRetryGoogle).toHaveBeenCalledOnce();
    expect(onBackToLogin).toHaveBeenCalledOnce();
  });

  it("sin mensaje usa el texto de cuenta UMSSY no encontrada", () => {
    render(<GoogleAccessDenied denied={{ reason: "not_registered" }} onRetryGoogle={vi.fn()} onBackToLogin={vi.fn()} />);
    expect(screen.getByText("No se encontró una cuenta UMSSY asociada a este correo de Google")).toBeInTheDocument();
  });

  it("rol no permitido: ofrece la contraseña o probar otra cuenta de Google", async () => {
    const onRetryGoogle = vi.fn();
    const onBackToLogin = vi.fn();
    render(<GoogleAccessDenied denied={{ reason: "role_not_allowed" }} onRetryGoogle={onRetryGoogle} onBackToLogin={onBackToLogin} />);

    expect(screen.getByText(/Si eres empresa o administrativo/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión con contraseña/i }));
    await userEvent.click(screen.getByRole("button", { name: "Probar con otra cuenta de Google" }));
    expect(onBackToLogin).toHaveBeenCalledOnce();
    expect(onRetryGoogle).toHaveBeenCalledOnce();
  });
});
