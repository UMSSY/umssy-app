import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MatchScoreBar } from "./match-score-bar";
import { HIGH_AFFINITY_THRESHOLD } from "../constants/job-matching.constants";

function getFillFromRoot(container: HTMLElement): string {
  const root = container.querySelector('[data-slot="progress"]');
  return root?.getAttribute("style") ?? "";
}

function getBlueShare(style: string): number {
  const m = style.match(
    /--affinity-fill:\s*color-mix\(in srgb,\s*var\(--color-accent\)\s+(\d+)%,\s*var\(--color-brand-red\)\)/,
  );
  if (!m) throw new Error(`No theme fill found in: ${style}`);
  return Number(m[1]);
}

describe("MatchScoreBar", () => {
  afterEach(cleanup);

  it.each([[0, 0], [49.8, 50], [100, 100], [125, 100], [-10, 0], [NaN, 0], [Infinity, 0]])(
    "renders score %s as %s through the UI progress component",
    (score, expected) => {
      render(<MatchScoreBar score={score} />);
      const progress = screen.getByRole("progressbar", { name: "Afinidad" });
      expect(progress).toHaveAttribute("aria-valuenow", String(expected));
      expect(progress).toHaveAttribute("data-slot", "progress");
      expect(screen.getByText(`${expected}%`)).toBeInTheDocument();
    },
  );

  it("keeps an accessible name when the visible label is hidden", () => {
    render(<MatchScoreBar score={60} showLabel={false} />);
    expect(screen.queryByText("Afinidad")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Afinidad" })).toHaveAttribute("aria-valuenow", "60");
  });

  it("updates the UI progress when compatibility changes after loading a profile", () => {
    const { rerender } = render(<MatchScoreBar score={0} />);
    rerender(<MatchScoreBar score={87.6} />);
    expect(screen.getByRole("progressbar", { name: "Afinidad" })).toHaveAttribute("aria-valuenow", "88");
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("overrides the shared indicator color without editing progress.tsx", () => {
    const { container } = render(<MatchScoreBar score={75} />);
    const root = container.querySelector('[data-slot="progress"]');
    expect(root?.className).toContain("[&_[data-slot=progress-indicator]]:!bg-[var(--affinity-fill)]");

    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator?.className).toContain("transition-all");
    expect(indicator?.className).toContain("duration-300");
  });

  it("keeps the track themed with the shared progress component", () => {
    const { container } = render(<MatchScoreBar score={75} />);
    expect(container.querySelector('[data-slot="progress-track"]')).toHaveClass("bg-muted");
  });

  it("fills red at 0% and blue from HIGH_AFFINITY_THRESHOLD", () => {
    const { rerender, container } = render(<MatchScoreBar score={0} />);
    expect(getBlueShare(getFillFromRoot(container))).toBe(0);

    rerender(<MatchScoreBar score={HIGH_AFFINITY_THRESHOLD} />);
    expect(getBlueShare(getFillFromRoot(container))).toBe(100);

    rerender(<MatchScoreBar score={100} />);
    expect(getBlueShare(getFillFromRoot(container))).toBe(100);
  });

  it("interpolates the fill between red and blue below the threshold", () => {
    const { container } = render(<MatchScoreBar score={HIGH_AFFINITY_THRESHOLD / 2} />);
    const blueShare = getBlueShare(getFillFromRoot(container));
    expect(blueShare).toBeGreaterThan(0);
    expect(blueShare).toBeLessThan(100);
  });

  it("builds the fill from theme tokens instead of fixed colors", () => {
    const { container } = render(<MatchScoreBar score={HIGH_AFFINITY_THRESHOLD / 2} />);
    const style = getFillFromRoot(container);
    expect(style).toContain("var(--color-accent)");
    expect(style).toContain("var(--color-brand-red)");
    expect(style).not.toMatch(/rgb\(|#[0-9a-f]{3,6}/i);
  });
});