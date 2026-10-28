import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import { useAvailabilityStatus } from "./use-availability-status"
import { availabilityApi } from "../services/availability.service"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("useAvailabilityStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it("refleja el estado actual del mentor", async () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockResolvedValue({ mentorId: "m1", isAvailable: true })
    const { result } = renderHook(() => useAvailabilityStatus(), createQueryWrapper())

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isAvailable).toBe(true))
    expect(result.current.isLoading).toBe(false)
  })

  it.each([
    [false, "Pausaste las solicitudes de mentoría. Tus citas confirmadas se mantienen."],
    [true, "Ahora recibes solicitudes de mentoría."],
  ])("guarda isAvailable=%s, avisa e invalida el perfil del mentor", async (isAvailable, message) => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockResolvedValue({ mentorId: "m1", isAvailable: !isAvailable })
    const updateSpy = vi
      .spyOn(availabilityApi, "updateAvailabilityStatus")
      .mockResolvedValue({ mentorId: "m1", isAvailable })
    const queryWrapper = createQueryWrapper()
    const invalidateSpy = vi.spyOn(queryWrapper.client, "invalidateQueries")
    const { result } = renderHook(() => useAvailabilityStatus(), queryWrapper)
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setAvailable(isAvailable))

    await waitFor(() => expect(result.current.isAvailable).toBe(isAvailable))
    expect(updateSpy).toHaveBeenCalledWith("m1", isAvailable)
    expect(toast.success).toHaveBeenCalledWith(message)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["mentorship", "profile", "m1"] })
  })

  it("muestra el detalle del backend y conserva el estado si falla", async () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockResolvedValue({ mentorId: "m1", isAvailable: true })
    vi.spyOn(availabilityApi, "updateAvailabilityStatus").mockRejectedValue({
      response: { data: { statusCode: 403, detail: "No puedes cambiar la disponibilidad de otro mentor", ok: false } },
    })
    const { result } = renderHook(() => useAvailabilityStatus(), createQueryWrapper())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setAvailable(false))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No puedes cambiar la disponibilidad de otro mentor"),
    )
    expect(result.current.isAvailable).toBe(true)
  })

  it("usa el mensaje genérico cuando la API falla sin detalle", async () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockResolvedValue({ mentorId: "m1", isAvailable: true })
    vi.spyOn(availabilityApi, "updateAvailabilityStatus").mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useAvailabilityStatus(), createQueryWrapper())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setAvailable(false))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo actualizar tu disponibilidad"))
  })

  it("no envía cambios antes de conocer el estado", () => {
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockImplementation(() => new Promise(() => {}))
    const updateSpy = vi.spyOn(availabilityApi, "updateAvailabilityStatus")
    const { result } = renderHook(() => useAvailabilityStatus(), createQueryWrapper())

    act(() => result.current.setAvailable(false))

    expect(updateSpy).not.toHaveBeenCalled()
  })
})
