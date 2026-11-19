import "@/shared/testing/indexed-db.mock";
import { onlineManager } from "@tanstack/react-query";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OFFLINE_PASSES_OWNER_KEY, offlinePassesKey } from "@/shared/constants/offline-passes.constants";
import { writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { endOfflinePassesSession } from "@/shared/services/storage/offline-passes-owner";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { OfflinePassesRouteView } from "./offline-passes-route-view";

vi.mock("@/shared/components/layout", () => ({ BrandLogo: () => <span>UMSSY</span> }));

const pass = {
  id: "reg-1",
  eventName: "Taller de React",
  date: "2099-11-20",
  startTime: "09:00",
  endTime: "12:00",
  location: "Aula 101",
  status: "Confirmada",
  qrToken: "c".repeat(64),
};
const goOffline = () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  onlineManager.setOnline(false);
};

async function seedSavedCopy() {
  await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, "user-a");
  await writeIndexedDb(offlinePassesKey("user-a"), {
    userId: "user-a",
    savedAt: "2026-11-18T12:00:00.000Z",
    passes: [pass],
  });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  onlineManager.setOnline(true);
});

describe("OfflinePassesRouteView", () => {
  it("shows the saved passes when the site cannot be reached although the browser reports a connection", async () => {
    await seedSavedCopy();
    render(<OfflinePassesRouteView />);
    expect(await screen.findByText(/No se pudieron actualizar tus pases/)).toBeInTheDocument();
    const panel = await screen.findByRole("complementary", { name: "Detalle de la inscripción" });
    expect(await within(panel).findByRole("img", { name: "Código QR del pase" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Mis inscripciones" })).toHaveAttribute("href", "/events/my-passes");
  });

  it("hides the saved passes after the session ended", async () => {
    await seedSavedCopy();
    await endOfflinePassesSession("user-a");
    goOffline();
    render(<OfflinePassesRouteView />);
    expect(await screen.findByRole("heading", { name: "No hay pases guardados en este dispositivo." })).toBeInTheDocument();
  });

  it("shows the device owner's passes and QR offline without a session token", async () => {
    await seedSavedCopy();
    goOffline();
    render(<OfflinePassesRouteView />);
    expect(await screen.findByText("Sin conexión. Estás viendo tus pases guardados.")).toBeInTheDocument();
    const panel = await screen.findByRole("complementary", { name: "Detalle de la inscripción" });
    expect(await within(panel).findByRole("img", { name: "Código QR del pase" })).toBeInTheDocument();
    expect(screen.queryByText("Inicia sesión para consultar el pase.")).not.toBeInTheDocument();
  });

  it("explains there is no saved copy offline", async () => {
    goOffline();
    render(<OfflinePassesRouteView />);
    expect(await screen.findByRole("heading", { name: "No hay pases guardados en este dispositivo." })).toBeInTheDocument();
  });
});
