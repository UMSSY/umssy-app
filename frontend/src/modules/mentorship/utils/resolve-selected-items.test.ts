import { describe, expect, it } from "vitest";
import { resolveSelectedItems } from "./resolve-selected-items";

const catalog = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("resolveSelectedItems", () => {
  it("usa los datos guardados cuando no hay borrador", () => {
    expect(resolveSelectedItems(catalog, null, ["a"])).toEqual([{ id: "a" }]);
  });
  it("usa el borrador cuando existe", () => {
    expect(resolveSelectedItems(catalog, ["b", "c"], ["a"])).toEqual([{ id: "b" }, { id: "c" }]);
  });
  it("respeta un borrador vacío", () => {
    expect(resolveSelectedItems(catalog, [], ["a"])).toEqual([]);
  });
});