import { act, cleanup, render, screen } from "@testing-library/react"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Toaster } from "./sonner"

describe.each(["light", "dark"] as const)("Toaster con preferencia %s", (preference) => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("dark") && preference === "dark",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: () => false,
    })))
  })

  afterEach(() => {
    act(() => toast.dismiss())
    cleanup()
    vi.unstubAllGlobals()
  })

  it.each(["success", "error", "info", "warning"] as const)(
    "mantiene el tema claro y muestra título y descripción del aviso %s sin ThemeProvider",
    async (type) => {
      render(<Toaster />)
      act(() => {
        toast[type]("Resultado de la reserva", { description: "Revisa el horario de la cita." })
      })

      expect(await screen.findByText("Resultado de la reserva")).toBeVisible()
      expect(screen.getByText("Revisa el horario de la cita.")).toBeVisible()
      const toaster = document.querySelector("[data-sonner-toaster]")
      expect(toaster).toHaveAttribute("data-sonner-theme", "light")
      expect(toaster).toHaveStyle({
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
      })
      expect(document.querySelector("[data-sonner-toast]")).toHaveAttribute("data-type", type)
    },
  )
})
