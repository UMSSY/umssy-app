
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/services/query-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { verificationApi } from "@/modules/documents/services/document-verification.service";
import ColaRevisionPage from "./page";

vi.mock("@/modules/documents/services/document-verification.service", () => ({
  verificationApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

function renderQueuePage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ColaRevisionPage />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("ColaRevisionPage", () => {
  it("renders the persistent review queue", async () => {
    renderQueuePage();

    expect(
      screen.getByRole("heading", {
        name: "Revisión documental y de radares",
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("No hay documentos pendientes."),
    ).toBeInTheDocument();
    expect(verificationApi.list).toHaveBeenCalledWith(true, "pending");
  });

  it("offers the current document review filters", () => {
    renderQueuePage();

    for (const name of ["Pendientes", "Aprobados", "Rechazados", "Todos"]) {
      expect(
        screen.getByRole("button", { name }),
      ).toBeInTheDocument();
    }
  });
});
