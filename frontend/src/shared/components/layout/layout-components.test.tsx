import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { Breadcrumbs } from "./breadcrumbs"
import { Shell } from "./shell"
import { Sidebar } from "./sidebar"

const mocks = vi.hoisted(() => ({ pathname: "/mentors/participation" }))

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }))

const link = (name: RegExp) => screen.getByRole("link", { name })

afterEach(() => {
  cleanup()
  mocks.pathname = "/mentors/participation"
})

describe("Sidebar", () => {
  it("muestra la marca y la tarjeta del usuario", () => {
    render(<Sidebar />)
    expect(screen.getByText("UMSSY ALUMNI")).toBeTruthy()
    expect(screen.getByText("Alex Vasquez")).toBeTruthy()
  })

  it("marca Mi participación como opción activa", () => {
    render(<Sidebar />)
    expect(link(/Mi participación/).getAttribute("aria-current")).toBe("page")
    expect(link(/Inicio/).getAttribute("aria-current")).toBeNull()
  })

  it("marca Inicio como activa en la raíz", () => {
    mocks.pathname = "/"
    render(<Sidebar />)
    expect(link(/Inicio/).getAttribute("aria-current")).toBe("page")
  })
})

describe("Breadcrumbs", () => {
  const items = [
    { label: "UMSSY", href: "/" },
    { label: "Mentorías" },
    { label: "Áreas técnicas" },
  ]

  it("renderiza los items y marca el último como página actual", () => {
    render(<Breadcrumbs items={items} />)
    expect(link(/UMSSY/).getAttribute("href")).toBe("/")
    expect(screen.getByText("Mentorías")).toBeTruthy()
    expect(screen.getByText("Áreas técnicas").getAttribute("aria-current")).toBe("page")
  })
})

describe("Shell", () => {
  it("renderiza el contenido dentro del main", () => {
    render(
      <Shell>
        <p>contenido</p>
      </Shell>
    )
    expect(screen.getByRole("main").textContent).toContain("contenido")
    expect(screen.getByText("Comunidad de Egresados UMSS")).toBeTruthy()
  })
})