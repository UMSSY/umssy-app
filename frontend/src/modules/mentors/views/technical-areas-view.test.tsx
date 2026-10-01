import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { TechnicalAreasView } from "./technical-areas-view"
import { saveMentorAreas } from "../services/technical-areas.mock"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("../services/technical-areas.mock", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../services/technical-areas.mock")>()
  return { ...actual, saveMentorAreas: vi.fn() }
})

const card = (name: RegExp) => screen.getByRole("checkbox", { name })
const button = (name: RegExp | string) => screen.getByRole("button", { name })

describe("TechnicalAreasView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(saveMentorAreas).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
  })

  describe("modo register", () => {
    it("muestra las 8 áreas sin marcar, alerta y botón bloqueado", () => {
      render(<TechnicalAreasView mode="register" />)
      expect(screen.getAllByRole("checkbox")).toHaveLength(8)
      expect(screen.getByRole("alert").textContent).toContain(
        "Debe seleccionarse al menos un área para continuar"
      )
      expect((button(/Continuar/) as HTMLButtonElement).disabled).toBe(true)
    })

    it("al marcar un área actualiza el contador y habilita el botón", () => {
      render(<TechnicalAreasView mode="register" />)
      fireEvent.click(card(/Backend/))
      expect(screen.getByText("1 seleccionadas")).toBeTruthy()
      expect(screen.queryByRole("alert")).toBeNull()
      expect((button(/Continuar/) as HTMLButtonElement).disabled).toBe(false)
    })

    it("al desmarcar un área vuelve al estado neutro", () => {
      render(<TechnicalAreasView mode="register" />)
      fireEvent.click(card(/Backend/))
      expect(card(/Backend/).getAttribute("aria-checked")).toBe("true")
      fireEvent.click(card(/Backend/))
      expect(card(/Backend/).getAttribute("aria-checked")).toBe("false")
    })

    it("Continuar avanza al Paso 3", () => {
      render(<TechnicalAreasView mode="register" />)
      fireEvent.click(card(/Backend/))
      fireEvent.click(button(/Continuar/))
      expect(push).toHaveBeenCalledWith("/mentors/register/guidance")
    })
  })

  describe("modo edit", () => {
    it("carga marcadas las áreas del mentor (Backend, Cloud, Arquitectura)", () => {
      render(<TechnicalAreasView mode="edit" />)
      expect(card(/Backend/).getAttribute("aria-checked")).toBe("true")
      expect(card(/Cloud/).getAttribute("aria-checked")).toBe("true")
      expect(card(/Arquitectura/).getAttribute("aria-checked")).toBe("true")
      expect(card(/QA/).getAttribute("aria-checked")).toBe("false")
      expect(screen.getByText("3 seleccionadas")).toBeTruthy()
    })

    it("desmarcar todo muestra la alerta y bloquea Guardar", () => {
      render(<TechnicalAreasView mode="edit" />)
      fireEvent.click(card(/Backend/))
      fireEvent.click(card(/Cloud/))
      fireEvent.click(card(/Arquitectura/))
      expect(screen.getByRole("alert")).toBeTruthy()
      expect((button(/Guardar cambios/) as HTMLButtonElement).disabled).toBe(true)
    })

    it("guardar con éxito envía las áreas y muestra el toast", async () => {
      render(<TechnicalAreasView mode="edit" />)
      fireEvent.click(card(/QA/))
      fireEvent.click(button(/Guardar cambios/))
      expect(
        await screen.findByText("Áreas técnicas actualizadas correctamente")
      ).toBeTruthy()
      expect(saveMentorAreas).toHaveBeenCalledWith([1, 6, 8, 4])
    })

    it("si falla el guardado muestra el mensaje de error", async () => {
      vi.mocked(saveMentorAreas).mockRejectedValueOnce(new Error("500"))
      render(<TechnicalAreasView mode="edit" />)
      fireEvent.click(card(/QA/))
      fireEvent.click(button(/Guardar cambios/))
      expect(
        await screen.findByText(
          "No se pudieron guardar los cambios. Intente nuevamente."
        )
      ).toBeTruthy()
    })

    it("Volver sin cambios regresa directo a Mi participación", () => {
      render(<TechnicalAreasView mode="edit" />)
      fireEvent.click(button(/Volver/))
      expect(push).toHaveBeenCalledWith("/mentors/participation")
    })

    it("Volver con cambios abre el modal y Seguir editando lo cierra", () => {
      render(<TechnicalAreasView mode="edit" />)
      fireEvent.click(card(/QA/))
      fireEvent.click(button(/Volver/))
      expect(screen.getByText("¿Descartar cambios?")).toBeTruthy()
      fireEvent.click(button("Seguir editando"))
      expect(screen.queryByText("¿Descartar cambios?")).toBeNull()
      expect(push).not.toHaveBeenCalled()
    })

    it("Descartar en el modal regresa a Mi participación", () => {
      render(<TechnicalAreasView mode="edit" />)
      fireEvent.click(card(/QA/))
      fireEvent.click(button(/Volver/))
      fireEvent.click(button("Descartar"))
      expect(push).toHaveBeenCalledWith("/mentors/participation")
    })
  })
})
