import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { useLogin } from "../hooks/use-login";
import { LoginView } from "./login-view";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../hooks/use-login", () => ({
  useLogin: vi.fn(),
}));

vi.mock("@/shared/services/storage/access-token-storage", () => ({
  saveAccessToken: vi.fn(),
}));

describe("LoginView", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("stores the returned access token and redirects after a successful login", async () => {
    const login = vi.fn().mockResolvedValue({
      accessToken: "returned-token",
      roleTag: "titulado",
    });
    vi.mocked(useLogin).mockReturnValue({ login, isLoading: false, error: null });

    render(<LoginView />);

    fireEvent.change(screen.getByPlaceholderText("nombre@ejemplo.com"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("********"), {
      target: { value: "secret" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Iniciar sesión" }).closest("form")!);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "secret",
        roleTag: "titulado",
      });
      expect(saveAccessToken).toHaveBeenCalledWith("returned-token");
      expect(push).toHaveBeenCalledWith("/profile");
    });
  });
});
