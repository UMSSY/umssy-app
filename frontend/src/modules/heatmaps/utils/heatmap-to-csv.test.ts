import { describe, expect, it } from "vitest";
import { heatmapToCsv } from "./heatmap-to-csv";

describe("heatmapToCsv", () => {
  it("incluye la base, columnas dinámicas, columnas extra y celdas vacías", () => {
    const csv = heatmapToCsv({
      heatmapType: "skills-by-experience",
      baseCount: 4,
      baseLabel: "titulados con experiencia laboral registrada",
      columns: [
        { id: "junior", label: "Junior" },
        { id: "senior", label: "Senior" },
      ],
      extraColumnsConfig: [{ id: "top", label: "Mayor adopción en", format: "badge" }],
      rows: [
        {
          skillId: "sql",
          skillName: "SQL, bases de datos",
          cells: [
            { columnId: "junior", count: 1, total: 2, percentage: 50 },
            { columnId: "senior", isEmpty: true },
          ],
          extraValues: { top: { badgeText: "Junior" } },
        },
      ],
    });

    expect(csv.split("\n")).toEqual([
      "Base: 4 titulados con experiencia laboral registrada",
      "Habilidad técnica,Junior (cantidad),Junior (%),Senior (cantidad),Senior (%),Mayor adopción en",
      '"SQL, bases de datos",1,50,,,Junior',
    ]);
  });
});
