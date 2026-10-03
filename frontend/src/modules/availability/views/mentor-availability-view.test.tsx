import { render, screen, waitFor, cleanup } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { MentorAvailabilityView } from "./mentor-availability-view"
import { availabilityApi } from "../services/availability.api"

describe("MentorAvailabilityView", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renderiza estado de carga inicial", () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockImplementation(
      () => new Promise(() => {})
    )

    render(<MentorAvailabilityView />)
    expect(screen.getByText("Cargando disponibilidad...")).toBeInTheDocument()
  })

  it("renderiza lista de bloques de disponibilidad", async () => {
    const mockBlocks = [
      { id: "1", mentorId: "m1", startAt: "2024-01-15T10:00:00Z", endAt: "2024-01-15T11:00:00Z", state: "free" as const, createdAt: "", updatedAt: "" },
      { id: "2", mentorId: "m1", startAt: "2024-01-15T14:00:00Z", endAt: "2024-01-15T15:00:00Z", state: "free" as const, createdAt: "", updatedAt: "" },
    ]
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue(mockBlocks)

    render(<MentorAvailabilityView />)

    await waitFor(() => {
      expect(screen.getByText("Mi Disponibilidad")).toBeInTheDocument()
    })
    expect(screen.getAllByText(/Inicio:/)).toHaveLength(2)
    expect(screen.getAllByText(/Fin:/)).toHaveLength(2)
  })

  it("renderiza mensaje cuando no hay bloques", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    render(<MentorAvailabilityView />)

    await waitFor(() => {
      expect(screen.getByText("No hay bloques de disponibilidad aún.")).toBeInTheDocument()
    })
  })

  it("renderiza error cuando falla la petición", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockRejectedValue(new Error("Network error"))

    render(<MentorAvailabilityView />)

    await waitFor(() => {
      expect(screen.getByText("Error al obtener los bloques de disponibilidad")).toBeInTheDocument()
    })
  })
})
