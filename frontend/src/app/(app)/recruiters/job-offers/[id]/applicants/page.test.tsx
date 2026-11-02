import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JobOfferApplicantsPage from "./page";

vi.mock("@/modules/job-offers", () => ({
  JobOfferApplicantsView: ({ jobOfferId }: { jobOfferId: string }) => (
    <div data-testid="applicants-view">{jobOfferId}</div>
  ),
}));

describe("JobOfferApplicantsPage", () => {
  it("renderiza los postulantes de la vacante indicada en la ruta", async () => {
    render(await JobOfferApplicantsPage({ params: Promise.resolve({ id: "offer-1" }) }));

    expect(screen.getByTestId("applicants-view")).toHaveTextContent("offer-1");
  });
});
