import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SessionClosedPage, { metadata } from "./page";

vi.mock("@/modules/auth", () => ({
  SessionClosedView: () => (
    <div data-testid="session-closed-view">Mock Session Closed View</div>
  ),
}));

describe("SessionClosedPage", () => {
  it("renders the SessionClosedView component", () => {
    render(<SessionClosedPage />);
    expect(screen.getByTestId("session-closed-view")).toBeInTheDocument();
  });

  it("exports metadata with proper title", () => {
    expect(metadata.title).toBe("Tu sesión se cerró");
  });
});

