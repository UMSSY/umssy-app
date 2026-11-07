import { describe, expect, it } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { excludeWithdrawnApplications } from "./exclude-withdrawn-applications";

describe("excludeWithdrawnApplications", () => {
  it("removes only the withdrawn applications and keeps the order", () => {
    const applications = [
      buildApplication({ id: "a", status: "En revisión" }),
      buildApplication({ id: "b", status: "Retirada" }),
      buildApplication({ id: "c", status: "Aceptada" }),
    ];

    expect(excludeWithdrawnApplications(applications).map((application) => application.id)).toEqual(["a", "c"]);
  });

  it("does not modify the list it receives", () => {
    const applications = [buildApplication({ status: "Retirada" })];

    excludeWithdrawnApplications(applications);

    expect(applications).toHaveLength(1);
  });

  it("returns an empty list when every application is withdrawn", () => {
    expect(excludeWithdrawnApplications([buildApplication({ status: "Retirada" })])).toEqual([]);
  });
});
