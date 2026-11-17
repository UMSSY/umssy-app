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

  it("shows the X for a skill that only the user added by hand (AC-10.2)", () => {
    render(<SkillBadge skill={{ id: "skill-1", name: "SQL", origins: ["manual"] }} onRemove={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Quitar SQL" })).toBeInTheDocument();
  });

  it("hides the X for a skill linked to an experience even when it is also manual (AC-10.1)", () => {
    render(
      <>
        <SkillBadge skill={{ id: "skill-1", name: "SQL", origins: ["experience"] }} onRemove={vi.fn()} />
        <SkillBadge skill={{ id: "skill-2", name: "Python", origins: ["manual", "experience"] }} onRemove={vi.fn()} />
      </>,
    );

    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar SQL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar Python" })).not.toBeInTheDocument();
  });

  it("hides the X for a skill that comes from the CV", () => {
    render(
      <>
        <SkillBadge skill={{ id: "skill-1", name: "Docker", origins: ["cv"] }} onRemove={vi.fn()} />
        <SkillBadge skill={{ id: "skill-2", name: "Java", origins: ["manual", "cv"] }} onRemove={vi.fn()} />
      </>,
    );

    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar Docker" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar Java" })).not.toBeInTheDocument();
  });

  it("makes the X easy to press with a finger on mobile", () => {
    render(<SkillBadge skill={{ id: "skill-1", name: "SQL", origins: ["manual"] }} onRemove={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Quitar SQL" })).toHaveClass("size-7", "sm:size-5");
  });
});
