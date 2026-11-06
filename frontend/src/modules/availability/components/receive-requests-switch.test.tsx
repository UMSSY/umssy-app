import { screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderWithQuery } from "@/shared/testing/render-with-query"
import { ReceiveRequestsSwitch } from "./receive-requests-switch"
import { availabilityApi } from "../services/availability.service"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const getSwitch = () => screen.getByRole("switch", { name: "Recibir solicitudes de mentoría" })

describe("ReceiveRequestsSwitch", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("queda deshabilitado mientras carga el estado", () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockImplementation(() => new Promise(() => {}))

    renderWithQuery(<ReceiveRequestsSwitch />)

    expect(getSwitch()).toHaveAttribute("aria-disabled", "true")
  })

  it("muestra encendido cuando el mentor recibe solicitudes", async () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockResolvedValue({ mentorId: "m1", isAvailable: true })

    renderWithQuery(<ReceiveRequestsSwitch />)

    await waitFor(() => expect(getSwitch()).toHaveAttribute("aria-checked", "true"))
    expect(screen.getByText("Los egresados pueden solicitarte mentorías.")).toBeInTheDocument()
  })

  it("al apagarlo pausa las solicitudes y avisa que las citas se mantienen", async () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockResolvedValue({ mentorId: "m1", isAvailable: true })
    const updateSpy = vi
      .spyOn(availabilityApi, "updateAvailabilityStatus")
      .mockResolvedValue({ mentorId: "m1", isAvailable: false })
    renderWithQuery(<ReceiveRequestsSwitch />)
    await waitFor(() => expect(getSwitch()).toHaveAttribute("aria-checked", "true"))

    await userEvent.click(getSwitch())

    await waitFor(() => expect(getSwitch()).toHaveAttribute("aria-checked", "false"))
    expect(updateSpy).toHaveBeenCalledWith("m1", false)
    expect(screen.getByText("Pausado: tus citas confirmadas se mantienen.")).toBeInTheDocument()
  })

  it("avisa y deshabilita el interruptor si no se pudo cargar el estado", async () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockRejectedValue(new Error("Network error"))

    renderWithQuery(<ReceiveRequestsSwitch />)

    expect(await screen.findByText("No se pudo cargar tu estado de disponibilidad")).toBeInTheDocument()
    expect(getSwitch()).toHaveAttribute("aria-disabled", "true")
  })
})
