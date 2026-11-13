import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NoOfflineCopyState } from "./no-offline-copy-state";
import { OfflineAvailableBadge } from "./offline-available-badge";
import { OfflineStatusBanner } from "./offline-status-banner";

afterEach(cleanup);

describe("OfflineStatusBanner", () => {
  it("tells the user they are viewing saved passes offline with the last update", () => {
    render(<OfflineStatusBanner isOnline={false} lastUpdated="13 nov 2026, 14:30" isStale={false} onRetry={vi.fn()} />);
    expect(screen.getByText("Sin conexión. Estás viendo tus pases guardados.")).toBeInTheDocument();
    expect(screen.getByText("Última actualización: 13 nov 2026, 14:30").tagName).toBe("P");
    expect(screen.queryByText(/más de 24 horas/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("warns about stale copies and offers a retry when the online refresh failed", () => {
    const onRetry = vi.fn();
    render(<OfflineStatusBanner isOnline lastUpdated={null} isStale onRetry={onRetry} />);
    expect(screen.getByRole("status")).toHaveTextContent("No se pudieron actualizar tus pases");
    expect(screen.getByRole("status")).not.toHaveTextContent("Última actualización");
    expect(screen.getByText(/más de 24 horas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("offline pass indicators", () => {
  it("labels passes available without connection", () => {
    render(<OfflineAvailableBadge />);
    expect(screen.getByText("Disponible sin conexión")).toBeInTheDocument();
  });

  it("explains that there is no saved copy instead of the empty registrations state", () => {
    render(<NoOfflineCopyState />);
    expect(screen.getByRole("heading", { name: "No hay pases guardados en este dispositivo." })).toBeInTheDocument();
    expect(screen.getByText("Conéctate a Internet para cargarlos.")).toBeInTheDocument();
    expect(screen.queryByText(/Aún no tienes inscripciones/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
