import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NewAvailabilityView } from "./new-availability-view"
import { availabilityApi } from "../services/availability.api"
import type { AvailabilityBlock } from "../types/availability"

const mockBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2024-01-15T10:00:00Z",
  endAt: "2024-01-15T11:00:00Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, startAt: string, endAt: string) {
  await user.type(screen.getByTestId("startAt-input"), startAt)
  await user.type(screen.getByTestId("endAt-input"), endAt)
  await user.click(screen.getByRole("button", { name: "Crear" }))
}

describe("NewAvailabilityView", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renderiza el formulario de creación solo con inicio y fin", () => {
    render(<NewAvailabilityView />)

    expect(screen.getByText("Crear Nuevo Bloque de Disponibilidad")).toBeInTheDocument()
    expect(screen.getByTestId("startAt-input")).toBeInTheDocument()
    expect(screen.getByTestId("endAt-input")).toBeInTheDocument()
    expect(screen.queryByTestId("mentorId-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("repeatUntil-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("seriesId-input")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument()
  })

  it("no pide la lista de bloques al montar", () => {
    const spy = vi.spyOn(availabilityApi, "getAvailabilityBlocks")

    render(<NewAvailabilityView />)

    expect(spy).not.toHaveBeenCalled()
  })

  it("crea un bloque de disponibilidad correctamente", async () => {
    const createSpy = vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue(mockBlock)

    render(<NewAvailabilityView />)
    const user = userEvent.setup()

    await fillAndSubmit(user, "2024-01-15T10:00", "2024-01-15T11:00")

    await waitFor(() => {
      expect(screen.getByText("¡Bloque de disponibilidad creado exitosamente!")).toBeInTheDocument()
    })
    expect(createSpy).toHaveBeenCalledWith({ startAt: "2024-01-15T10:00", endAt: "2024-01-15T11:00" })
  })

  it("muestra error cuando falla la creación y lo limpia al reintentar con éxito", async () => {
    vi.spyOn(availabilityApi, "createAvailabilityBlock")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockBlock)

    render(<NewAvailabilityView />)
    const user = userEvent.setup()

    await fillAndSubmit(user, "2024-01-15T10:00", "2024-01-15T11:00")

    await waitFor(() => {
      expect(screen.getByText("Error al crear el bloque de disponibilidad")).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Crear" }))

    await waitFor(() => {
      expect(screen.getByText("¡Bloque de disponibilidad creado exitosamente!")).toBeInTheDocument()
    })
    expect(screen.queryByText("Error al crear el bloque de disponibilidad")).not.toBeInTheDocument()
  })

  it("valida que endAt sea posterior a startAt", async () => {
    const createSpy = vi.spyOn(availabilityApi, "createAvailabilityBlock")

    render(<NewAvailabilityView />)
    const user = userEvent.setup()

    await fillAndSubmit(user, "2024-01-15T11:00", "2024-01-15T10:00")

    await waitFor(() => {
      expect(screen.getByText("La hora de fin debe ser posterior a la hora de inicio")).toBeInTheDocument()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("deshabilita el botón mientras está enviando", async () => {
    let resolvePromise: (value: AvailabilityBlock) => void
    const promise = new Promise<AvailabilityBlock>((resolve) => { resolvePromise = resolve })
    vi.spyOn(availabilityApi, "createAvailabilityBlock").mockReturnValue(promise)

    render(<NewAvailabilityView />)
    const user = userEvent.setup()

    await fillAndSubmit(user, "2024-01-15T10:00", "2024-01-15T11:00")

    expect(screen.getByRole("button", { name: "Creando..." })).toBeDisabled()
    resolvePromise!(mockBlock)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Crear" })).toBeEnabled()
    })
  })
})
