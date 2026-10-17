import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import RequirementAnalysisPage from "./page";

afterEach(() => {
  cleanup();
});

describe("RequirementAnalysisPage", () => {
  it("monta la vista de análisis de requisitos", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RequirementAnalysisPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Analizar requisitos de una oferta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar texto de ejemplo" })).toBeInTheDocument();
  });
});
