import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ReviewQueueView } from "./review-queue-view";

afterEach(cleanup);

describe("ReviewQueueView", () => {
  it("selects a profile, displays its scores and keeps demonstration actions explicit", async () => {
    const user = userEvent.setup();
    render(<ReviewQueueView />);
    expect(screen.queryByRole("button", { name: "Aprobar y publicar radar" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Carlos Rodríguez/ }));
    expect(screen.getByRole("heading", { name: "Carlos Rodríguez" })).toBeInTheDocument();
    expect(screen.getByText("Puntaje de afinidad del perfil")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar y publicar radar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Radar aprobado localmente");
    await user.click(screen.getByRole("button", { name: "Pendiente" }));
    expect(screen.queryByRole("heading", { name: "Carlos Rodríguez" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pendiente" })).toHaveAttribute("aria-pressed", "true");
    const row = screen.getByRole("button", { name: /María López/ });
    expect(within(row).getByText("Data Analyst")).toBeInTheDocument();
    await user.click(row);
    expect(screen.getByRole("heading", { name: "María López" })).toBeInTheDocument();
  });
});
