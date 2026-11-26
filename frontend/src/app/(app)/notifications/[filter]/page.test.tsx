import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotificationsFilterPage from "./page";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

vi.mock("@/modules/notifications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/notifications")>()),
  NotificationsView: ({ filter }: { filter?: string }) => <p>Filtro: {filter}</p>,
}));

vi.mock("@/modules/surveys", () => ({
  SurveyNotificationsSection: () => null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NotificationsFilterPage", () => {
  it("muestra la bandeja con el filtro del segmento de la ruta", async () => {
    const page = await NotificationsFilterPage({
      params: Promise.resolve({ filter: "reminders" }),
    });

    render(page);

    expect(screen.getByText("Filtro: REMINDERS")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("responde 404 con un segmento que no es un filtro", async () => {
    await expect(
      NotificationsFilterPage({ params: Promise.resolve({ filter: "chat" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});