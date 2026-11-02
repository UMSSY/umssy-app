import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ForgotPasswordPage, { metadata } from "./page";

vi.mock("@/modules/auth", () => ({
  ForgotPasswordView: () => <div data-testid="forgot-password-view">Mock Forgot Password View</div>,
}));

describe("ForgotPasswordPage", () => {
  it("renders the ForgotPasswordView component", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByTestId("forgot-password-view")).toBeInTheDocument();
  });

  it("exports metadata with proper title", () => {
    expect(metadata.title).toBe("Recuperar contraseña");
  });
});
