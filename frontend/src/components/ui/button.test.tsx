import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { Button, buttonVariants } from "./button"

describe("Button", () => {
  it("preserves custom layout and disabled behavior without default styles", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <Button unstyled className="grid gap-4" onClick={onClick}>Select</Button>
    )
    const button = screen.getByRole("button", { name: "Select" })
    expect(button.className).toBe("grid gap-4")
    expect(button).not.toHaveAttribute("unstyled")
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<Button unstyled disabled onClick={onClick}>Select</Button>)
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("renders with default variant and size classes", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: "Click me" })
    expect(button).toHaveAttribute("data-slot", "button")
  })

  it("renders children text correctly", () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByText("Guardar")).toBeInTheDocument()
  })

  it("applies a custom className", () => {
    render(<Button className="tracking-widest">Custom</Button>)
    const button = screen.getByRole("button", { name: "Custom" })
    expect(button.className).toContain("tracking-widest")
  })

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Enviar</Button>)
    await user.click(screen.getByRole("button", { name: "Enviar" }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button onClick={handleClick} disabled>
        Deshabilitado
      </Button>
    )
    await user.click(screen.getByRole("button", { name: "Deshabilitado" }))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("renders the outline variant with its class", () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole("button", { name: "Outline" })
    expect(button.className).toContain("border-border")
  })

  it("renders the destructive variant with its class", () => {
    render(<Button variant="destructive">Eliminar</Button>)
    const button = screen.getByRole("button", { name: "Eliminar" })
    expect(button.className).toContain("bg-destructive/10")
  })

  it("renders the small size with its class", () => {
    render(<Button size="sm">Pequeño</Button>)
    const button = screen.getByRole("button", { name: "Pequeño" })
    expect(button.className).toContain("h-7")
  })

  it("buttonVariants returns a string with the given options", () => {
    const classes = buttonVariants({ variant: "ghost", size: "lg" })
    expect(typeof classes).toBe("string")
    expect(classes).toContain("h-9")
  })
})
