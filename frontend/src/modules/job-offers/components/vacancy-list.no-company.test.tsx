import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { useCompanyJobOffers } from "../hooks/use-company-job-offers";
import { VacancyList } from "./vacancy-list";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../hooks/use-company-job-offers", () => ({
  useCompanyJobOffers: vi.fn(),
}));

describe("VacancyList sin empresa vinculada", () => {
  afterEach(() => cleanup());

  it("explica que la cuenta no está vinculada y no ofrece reintentar", () => {
    vi.mocked(useCompanyJobOffers).mockReturnValue({
      companyId: null,
      offers: [],
      status: "no-company",
      reload: vi.fn(),
    });

    renderWithQuery(<VacancyList />);

    expect(screen.getByRole("alert")).toHaveTextContent("Tu cuenta aún no está vinculada a una empresa");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });
});
