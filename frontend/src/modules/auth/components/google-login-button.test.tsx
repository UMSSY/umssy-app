import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleLoginButton } from "./google-login-button";

describe("GoogleLoginButton", () => {
  afterEach(cleanup);

  it("muestra el botón y avisa al hacer clic", async () => {
    const onClick = vi.fn();
    render(<GoogleLoginButton isLoading={false} disabled={false} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("cargando o deshabilitado no permite hacer clic", async () => {
    const onClick = vi.fn();
    render(<GoogleLoginButton isLoading disabled onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Conectando con Google..." });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
