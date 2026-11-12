import { act, cleanup, render, screen } from "@testing-library/react"
import { toast } from "sonner"
import { afterEach, describe, expect, it } from "vitest"
import { Toaster } from "./sonner"

describe("Toaster", () => {
  afterEach(() => {
    act(() => toast.dismiss())
    cleanup()
  })

  it("usa el tema claro aunque el sistema esté en modo oscuro", async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("dark"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
    render(<Toaster />)

    act(() => {
      toast.success("Cita confirmada", { description: "Lunes 10:00" })
    })

    expect(await screen.findByText("Lunes 10:00")).toBeInTheDocument()
    expect(document.querySelector("[data-sonner-toaster]")).toHaveAttribute("data-sonner-theme", "light")
  })
})
