import { describe, expect, it } from "vitest";
import { toCvPage } from "./to-cv-page";

const CV_RESPONSE = {
  id: "cv-1",
  fileName: "CV-Test-User.pdf",
  fileType: "application/pdf",
  sizeInBytes: 1024,
  updatedAt: "2026-10-03T12:00:00.000Z",
  isCurrent: true,
};

describe("toCvPage", () => {
  it("maps the paginated response with its totals", () => {
    const page = toCvPage({
      items: [CV_RESPONSE],
      totalItems: 6,
      totalPages: 2,
      page: 1,
      limit: 5,
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ id: "cv-1", fileType: "PDF", isCurrent: true });
    expect(page).toMatchObject({ totalItems: 6, totalPages: 2, page: 1 });
  });

  it.each([null, undefined])("returns an empty first page for a %s response", (response) => {
    expect(toCvPage(response)).toEqual({ items: [], totalItems: 0, totalPages: 0, page: 1 });
  });

  it("treats missing items as an empty list", () => {
    expect(
      toCvPage({ items: null, totalItems: 0, totalPages: 0, page: 1, limit: 5 }).items,
    ).toEqual([]);
  });
});
