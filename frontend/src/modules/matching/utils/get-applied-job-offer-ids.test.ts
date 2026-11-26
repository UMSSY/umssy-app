import { describe, expect, it } from "vitest";
import type { Application } from "@/modules/applications";
import { getAppliedJobOfferIds } from "./get-applied-job-offer-ids";

function buildApplication(overrides: Partial<Application>): Application {
  return {
    id: "application-1",
    jobOfferId: "offer-1",
    vacancyTitle: "Backend",
    companyName: "Empresa",
    affinityPercentage: 80,
    status: "En revisión",
    appliedDate: "2026-11-10",
    vacancyAvailable: true,
    ...overrides,
  };
}

describe("getAppliedJobOfferIds", () => {
  it("devuelve las vacantes con postulación activa", () => {
    const ids = getAppliedJobOfferIds([
      buildApplication({ id: "a1", jobOfferId: "offer-1" }),
      buildApplication({ id: "a2", jobOfferId: "offer-2" }),
    ]);

    expect([...ids].sort()).toEqual(["offer-1", "offer-2"]);
  });

  it("ignora las postulaciones retiradas", () => {
    const ids = getAppliedJobOfferIds([
      buildApplication({ id: "a1", jobOfferId: "offer-1", status: "Retirada" }),
      buildApplication({ id: "a2", jobOfferId: "offer-2" }),
    ]);

    expect(ids.has("offer-1")).toBe(false);
    expect(ids.has("offer-2")).toBe(true);
  });

  it("devuelve un conjunto vacío sin datos", () => {
    expect(getAppliedJobOfferIds(undefined).size).toBe(0);
    expect(getAppliedJobOfferIds([]).size).toBe(0);
  });
});
