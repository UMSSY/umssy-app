import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";
import HomePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("Home Page", () => {
  it("redirige la entrada principal al inicio de sesión", () => {
    expect(() => HomePage()).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});