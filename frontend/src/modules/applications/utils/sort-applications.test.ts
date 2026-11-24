import { describe, expect, it } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { filterApplicationsByStatus } from "./filter-applications-by-status";
import { nextApplicationSort, sortApplications } from "./sort-applications";

const APPLICATIONS = [
  buildApplication({ id: "a", vacancyTitle: "Backend", companyName: "Zeta", affinityPercentage: 50, status: "En revisión" }),
  buildApplication({ id: "b", vacancyTitle: "análisis", companyName: "Alfa", affinityPercentage: 100, status: "Entrevista" }),
  buildApplication({ id: "c", vacancyTitle: "Cloud", companyName: "Media", affinityPercentage: 25, status: "Retirada" }),
];

const ids = (list: readonly { id: string }[]) => list.map((item) => item.id);

describe("sortApplications", () => {
  it("uses recent dates and vacancy title by default", () => {
    expect(ids(sortApplications(APPLICATIONS, null))).toEqual(["b", "a", "c"]);
  });

  it("sorts text ignoring case and accents", () => {
    expect(ids(sortApplications(APPLICATIONS, { key: "vacancy", direction: "asc" }))).toEqual(["b", "a", "c"]);
    expect(ids(sortApplications(APPLICATIONS, { key: "company", direction: "desc" }))).toEqual(["a", "c", "b"]);
  });

  it("sorts the affinity as a number", () => {
    expect(ids(sortApplications(APPLICATIONS, { key: "affinity", direction: "asc" }))).toEqual(["c", "a", "b"]);
  });

  it("does not mutate the original list", () => {
    sortApplications(APPLICATIONS, { key: "affinity", direction: "asc" });
    expect(ids(APPLICATIONS)).toEqual(["a", "b", "c"]);
  });
});

describe("nextApplicationSort", () => {
  it("starts ascending, then toggles to descending on the same column", () => {
    const first = nextApplicationSort(null, "status");
    expect(first).toEqual({ key: "status", direction: "asc" });
    expect(nextApplicationSort(first, "status")).toEqual({ key: "status", direction: "desc" });
  });

  it("restarts ascending when another column is chosen", () => {
    expect(nextApplicationSort({ key: "status", direction: "desc" }, "company")).toEqual({
      key: "company",
      direction: "asc",
    });
  });
});

describe("filterApplicationsByStatus", () => {
  it("returns every application for the all tab", () => {
    expect(ids(filterApplicationsByStatus(APPLICATIONS, "all"))).toEqual(["a", "b", "c"]);
  });

  it("returns only the applications in the chosen status", () => {
    expect(ids(filterApplicationsByStatus(APPLICATIONS, "Entrevista"))).toEqual(["b"]);
  });
});
