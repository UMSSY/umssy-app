import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SkillBadge } from "./skill-badge";

describe("SkillBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the skill name and removes it by id", async () => {
    const user = userEvent.setup();
    const handleRemove = vi.fn();
    render(<SkillBadge skill={{ id: "skill-1", name: "SQL" }} onRemove={handleRemove} />);

    expect(screen.getByText("SQL")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar SQL" }));

    expect(handleRemove).toHaveBeenCalledWith("skill-1");
  });

  it("keeps the remove option available for a very long name", async () => {
    const user = userEvent.setup();
    const handleRemove = vi.fn();
    const longName = "a".repeat(300);
    render(<SkillBadge skill={{ id: "skill-1", name: longName }} onRemove={handleRemove} />);

    expect(screen.getByText(longName)).toHaveClass("truncate");
    expect(screen.getByText(longName)).toHaveAttribute("title", longName);

    await user.click(screen.getByRole("button", { name: `Quitar ${longName}` }));

    expect(handleRemove).toHaveBeenCalledWith("skill-1");
  });

  it("AC-10.1: hides the X for a skill linked to an experience", () => {
    render(
      <SkillBadge
        skill={{ id: "skill-1", name: "SQL", origin: "experience", linkedExperienceCount: 2, isRemovable: false }}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar SQL" })).not.toBeInTheDocument();
    expect(screen.getByText("Respaldada por 2 experiencias laborales")).toBeInTheDocument();
  });

  it("AC-10.2: shows the X for a manual skill without links", () => {
    render(
      <SkillBadge
        skill={{ id: "skill-1", name: "SQL", origin: "manual", linkedExperienceCount: 0, isRemovable: true }}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Quitar SQL" })).toBeInTheDocument();
  });

  it("uses a larger touch target for the X on mobile", () => {
    render(<SkillBadge skill={{ id: "skill-1", name: "SQL" }} onRemove={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Quitar SQL" })).toHaveClass("size-8", "sm:size-5");
  });
});
