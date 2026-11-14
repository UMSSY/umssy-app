import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ApplicationStatusBadge } from "./application-status-badge";

afterEach(cleanup);

describe("ApplicationStatusBadge", () => {
  it.each([
    ["En revisión", "bg-availability"],
    ["Entrevista", "bg-availability"],
    ["Aceptada", "bg-success-soft"],
    ["No seleccionado", "bg-brand-soft"],
    ["Retirada", "bg-brand-soft"],
  ] as const)("shows %s with the color of its status", (status, colorClass) => {
    render(<ApplicationStatusBadge status={status} />);

    expect(screen.getByText(status)).toHaveClass(colorClass);
  });
});
