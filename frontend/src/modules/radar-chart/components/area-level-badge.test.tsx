import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AreaLevelBadge } from "./area-level-badge";

describe("AreaLevelBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it.each(["Bajo", "Medio", "Alto", "Experto"] as const)(
    "shows the %s level as plain text",
    (level) => {
      render(<AreaLevelBadge level={level} />);

      expect(screen.getByText(level)).toBeDefined();
    },
  );

  it.each([
    ["Bajo", 1],
    ["Medio", 2],
    ["Alto", 3],
    ["Experto", 4],
  ] as const)("shows %i active marks for %s", (level, activeCount) => {
    const { container } = render(<AreaLevelBadge level={level} />);

    const marks = container.querySelectorAll(".size-1\\.5.rounded-full");
    const activeMarks = Array.from(marks).filter(
      (m) => m.classList.contains("bg-ink") || m.classList.contains("bg-accent"),
    );

    expect(activeMarks).toHaveLength(activeCount);
  });

  it("uses the accent color for all marks when the level is Experto", () => {
    const { container } = render(<AreaLevelBadge level="Experto" />);

    const marks = container.querySelectorAll(".bg-accent.rounded-full");
    expect(marks).toHaveLength(4);
  });

  it("uses the ink color for active marks when not Experto", () => {
    const { container } = render(<AreaLevelBadge level="Alto" />);

    const inkMarks = container.querySelectorAll(".bg-ink.rounded-full");
    expect(inkMarks).toHaveLength(3);
  });

  it("does not use gold or semaphore backgrounds on the badge", () => {
    const { container } = render(<AreaLevelBadge level="Medio" />);

    expect(container.innerHTML).not.toContain("bg-gold");
    expect(container.innerHTML).not.toContain("text-danger");
  });
});
