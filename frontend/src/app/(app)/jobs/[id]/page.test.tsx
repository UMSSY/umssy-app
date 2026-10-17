import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { jobMatchingService } from "@/modules/matching/services/job-matching.service";
import { buildMatch } from "@/modules/matching/testing/job-fixtures";

import JobDetailPage from "./page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("JobDetailPage", () => {
  it("monta el detalle de la vacante con el id de la ruta", async () => {
    const getJobMatch = vi.spyOn(jobMatchingService, "getJobMatch").mockResolvedValue(buildMatch());
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        {await JobDetailPage({ params: Promise.resolve({ id: "abc" }) })}
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Desarrollador Backend" })).toBeInTheDocument();
    expect(getJobMatch).toHaveBeenCalledWith("abc");
  });
});
