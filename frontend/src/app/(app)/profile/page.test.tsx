import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileEditPage from "./edit/page";
import ProfilePage from "./page";

vi.mock("@/modules/profile", () => ({
  ProfileOverviewView: () => <p>overview</p>,
  ProfileEditView: ({ initialTab }: { initialTab: string }) => <p>edit:{initialTab}</p>,
  parseProfileTab: (tab: string | undefined) => tab ?? "personal",
}));

describe("profile pages", () => {
  afterEach(() => {
    cleanup();
  });

  it("mounts the overview view", () => {
    render(<ProfilePage />);

    expect(screen.getByText("overview")).toBeDefined();
  });

  it("mounts the edit view with the requested tab", async () => {
    const page = await ProfileEditPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({ tab: "presentation" }),
    });

    render(page);

    expect(screen.getByText("edit:presentation")).toBeDefined();
  });
});
