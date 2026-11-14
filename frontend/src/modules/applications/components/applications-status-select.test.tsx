import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApplicationsStatusSelect } from "./applications-status-select";

afterEach(cleanup);

describe("ApplicationsStatusSelect", () => {
  it("shows the selected status next to the Mostrar label", () => {
    render(<ApplicationsStatusSelect value="all" onValueChange={vi.fn()} showWithdrawn={false} />);

    expect(screen.getByRole("combobox", { name: "Mostrar:" })).toHaveTextContent("Todos");
  });

  it("offers every status except Retirada while the withdrawn applications are hidden", async () => {
    render(<ApplicationsStatusSelect value="all" onValueChange={vi.fn()} showWithdrawn={false} />);

    await userEvent.click(screen.getByRole("combobox", { name: "Mostrar:" }));

    expect(await screen.findAllByRole("option")).toHaveLength(5);
    expect(screen.getByRole("option", { name: "En revisión" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Retirada" })).not.toBeInTheDocument();
  });

  it("offers Retirada once the withdrawn applications are shown", async () => {
    render(<ApplicationsStatusSelect value="all" onValueChange={vi.fn()} showWithdrawn />);

    await userEvent.click(screen.getByRole("combobox", { name: "Mostrar:" }));

    expect(await screen.findByRole("option", { name: "Retirada" })).toBeInTheDocument();
  });

  it("reports the status the person picks", async () => {
    const onValueChange = vi.fn();
    render(<ApplicationsStatusSelect value="all" onValueChange={onValueChange} showWithdrawn={false} />);

    await userEvent.click(screen.getByRole("combobox", { name: "Mostrar:" }));
    await userEvent.click(await screen.findByRole("option", { name: "Entrevista" }));

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("Entrevista"));
  });
});
