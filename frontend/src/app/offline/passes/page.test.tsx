import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OfflinePassesPage, { metadata } from "./page";

vi.mock("@/modules/events", () => ({
  OfflinePassesRouteView: () => <p>Vista de pases guardados</p>,
}));

describe("Offline passes page", () => {
  it("renders the saved passes view with its own title", () => {
    render(<OfflinePassesPage />);
    expect(screen.getByText("Vista de pases guardados")).toBeInTheDocument();
    expect(metadata.title).toBe("Pases guardados · UMSSY");
  });
});
