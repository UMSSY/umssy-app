import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { Input } from "./input"

describe("Input", () => {
  afterEach(cleanup)

  it("keeps its default styling and accepts text", async () => {
    const user = userEvent.setup()
    render(<Input aria-label="Search" />)
    const input = screen.getByRole("textbox", { name: "Search" })
    expect(input).toHaveClass("border-input")
    await user.type(input, "workshop")
    expect(input).toHaveValue("workshop")
  })

  it("preserves custom layout, value updates and disabled behavior without default styles", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Input unstyled className="w-full p-4" aria-label="Search" />)
    const input = screen.getByRole("textbox", { name: "Search" })
    expect(input.className).toBe("w-full p-4")
    expect(input).not.toHaveAttribute("unstyled")
    await user.type(input, "workshop")
    expect(input).toHaveValue("workshop")
    rerender(<Input unstyled disabled aria-label="Search" />)
    await user.type(input, " ignored")
    expect(input).toBeDisabled()
    expect(input).toHaveValue("workshop")
  })
})
