import { afterEach, describe, expect, it } from "vitest";
import { isAppVisible } from "../utils/is-app-visible";

function setVisibilityState(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

afterEach(() => {
  setVisibilityState("visible");
});

describe("isAppVisible", () => {
  it("devuelve true cuando la página está en primer plano", () => {
    setVisibilityState("visible");
    expect(isAppVisible()).toBe(true);
  });

  it("devuelve false cuando la página está oculta", () => {
    setVisibilityState("hidden");
    expect(isAppVisible()).toBe(false);
  });
});
