import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import { useCreateAppointment } from "./use-create-appointment"
import { useMentorFreeBlocks } from "./use-mentor-free-blocks"
import { availabilityApi } from "../services/availability.service"
import type { AvailabilityBlock } from "../types/availability-block.types"
import { appointmentsApi, type Appointment, type AppointmentDocument } from "@/modules/appointments"
import { APPOINTMENT_DOCUMENT_TEXT } from "../constants/appointment-document.constants"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }))

const block: AvailabilityBlock = {
  id: "b1",
  mentorId: "m1",
  startAt: "2026-10-13T13:00:00.000Z",
  endAt: "2026-10-13T14:00:00.000Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

const variables = { block, values: { orientationTypeId: "t1", message: "  Hola  ", document: null } }

const conflictError = (detail?: string) => ({
  isAxiosError: true,
  response: { status: 409, data: detail ? { detail } : {} },
})

describe("useCreateAppointment", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
    vi.mocked(toast.warning).mockClear()
  })

  it("crea la cita, confirma con fecha y hora de Bolivia e invalida horarios y citas", async () => {
    const createSpy = vi
      .spyOn(appointmentsApi, "createAppointment")
      .mockResolvedValue({ id: "a1" } as Appointment)
    const queryWrapper = createQueryWrapper()
    const invalidateSpy = vi.spyOn(queryWrapper.client, "invalidateQueries")
    const onConflict = vi.fn()

    const { result } = renderHook(() => useCreateAppointment(onConflict), queryWrapper)

    const created = await act(async () => result.current.createAppointment(variables))

    expect(created).toBe(true)
    expect(createSpy).toHaveBeenCalledWith({ blockId: "b1", orientationTypeId: "t1", message: "Hola" })
    expect(toast.success).toHaveBeenCalledWith("Cita confirmada", {
      description: "Martes 13 de octubre de 2026, 09:00 - 10:00 · Hora de Bolivia (GMT-4)",
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["availability"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["appointments"] })
    expect(onConflict).not.toHaveBeenCalled()
  })

  it("con 409 avisa que el horario ya fue reservado y marca el bloque", async () => {
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue(conflictError())
    const onConflict = vi.fn()

    const { result } = renderHook(() => useCreateAppointment(onConflict), createQueryWrapper())

    const created = await act(async () => result.current.createAppointment(variables))

    expect(created).toBe(false)
    expect(toast.error).toHaveBeenCalledWith("Este horario ya fue reservado")
    expect(onConflict).toHaveBeenCalledWith(block)
  })

  it("con 409 usa el detail del backend si lo envía", async () => {
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue(
      conflictError("El mentor bloqueó ese día"),
    )

    const { result } = renderHook(() => useCreateAppointment(vi.fn()), createQueryWrapper())

    await act(async () => result.current.createAppointment(variables))

    expect(toast.error).toHaveBeenCalledWith("El mentor bloqueó ese día")
  })

  it.each([
    ["APPOINTMENT_OVERLAP", "Ya tienes una cita en ese horario. Elige otro horario."],
    ["DAILY_APPOINTMENT_LIMIT", "Ya tienes una cita reservada ese día. Elige otro día."],
  ])("con %s muestra el aviso sin marcar el bloque ni revelar detalles", async (code, message) => {
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { code, detail: "Texto distinto con datos privados", appointment: { name: "Privado", topic: "Privado" } } },
    })
    const onConflict = vi.fn()
    const onOverlap = vi.fn()
    const { result } = renderHook(() => useCreateAppointment(onConflict, onOverlap), createQueryWrapper())

    const created = await act(async () => result.current.createAppointment(variables))

    expect(created).toBe(false)
    expect(onOverlap).toHaveBeenCalledExactlyOnceWith(message)
    expect(onConflict).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("no identifica un cruce solo por el texto del detail", async () => {
    const detail = "Ya tienes una cita en ese horario. Elige otro horario."
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue(conflictError(detail))
    const onConflict = vi.fn()
    const onReservationRejected = vi.fn()
    const { result } = renderHook(
      () => useCreateAppointment(onConflict, onReservationRejected), createQueryWrapper(),
    )

    await act(async () => result.current.createAppointment(variables))

    expect(onReservationRejected).not.toHaveBeenCalled()
    expect(onConflict).toHaveBeenCalledWith(block)
  })

  it("con error de validación muestra el detalle sin quitar la selección", async () => {
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { detail: "El tema de la sesión no es válido" } },
    })
    const onConflict = vi.fn()
    const { result } = renderHook(() => useCreateAppointment(onConflict), createQueryWrapper())
    await act(async () => result.current.createAppointment(variables))
    expect(toast.error).toHaveBeenCalledWith("El tema de la sesión no es válido")
    expect(onConflict).not.toHaveBeenCalled()
    expect(result.current.canRetry).toBe(false)
  })

  it.each([
    [403, "MENTOR_UNAVAILABLE", "El mentor no está disponible para recibir citas."],
    [409, "SLOT_UNAVAILABLE", "Este horario ya no está disponible."],
  ])("con %s %s actualiza solo los horarios del mentor", async (status, code, message) => {
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue({
      isAxiosError: true, response: { status, data: { code, detail: "Detalle variable" } },
    })
    const wrapper = createQueryWrapper()
    const invalidate = vi.spyOn(wrapper.client, "invalidateQueries")
    const onConflict = vi.fn()
    const onUnavailable = vi.fn()
    const { result } = renderHook(() => useCreateAppointment(onConflict, vi.fn(), onUnavailable), wrapper)

    await act(async () => result.current.createAppointment(variables))

    expect(result.current.availabilityError).toBe(message)
    expect(result.current.canRetry).toBe(false)
    expect(onUnavailable).toHaveBeenCalledOnce()
    expect(onConflict).not.toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ["availability", "free-blocks", "m1"] })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it.each([
    new Error("Network error"),
    { isAxiosError: true, response: { status: 503, data: { detail: "Private service error" } } },
  ])("un fallo del servicio permite reintentar sin quitar el bloque", async (error) => {
    vi.spyOn(appointmentsApi, "createAppointment")
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ id: "a1" } as Appointment)
    const onUnavailable = vi.fn()
    const onConflict = vi.fn()
    const { result } = renderHook(() => useCreateAppointment(onConflict, vi.fn(), onUnavailable), createQueryWrapper())

    await act(async () => result.current.createAppointment(variables))
    expect(result.current.canRetry).toBe(true)
    expect(result.current.availabilityError).toBe("No se pudo verificar la disponibilidad del mentor. Intenta de nuevo.")
    expect(onUnavailable).not.toHaveBeenCalled()
    expect(onConflict).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()

    await act(async () => result.current.createAppointment(variables))
    expect(result.current.availabilityError).toBeNull()
    expect(result.current.canRetry).toBe(false)
  })

  it("el rechazo refresca la query activa y retira el horario eliminado sin recargar", async () => {
    const weekRange = { startAt: "2026-10-12T04:00:00.000Z", endAt: "2026-10-19T03:59:59.999Z" }
    const fetchSpy = vi.spyOn(availabilityApi, "getMentorFreeBlocks")
      .mockResolvedValueOnce([block]).mockResolvedValue([])
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue({
      isAxiosError: true, response: { status: 409, data: { code: "SLOT_UNAVAILABLE" } },
    })
    const { result } = renderHook(() => ({
      availability: useMentorFreeBlocks("m1", weekRange),
      booking: useCreateAppointment(vi.fn(), vi.fn(), vi.fn()),
    }), createQueryWrapper())
    await waitFor(() => expect(result.current.availability.blocks).toEqual([block]))

    await act(async () => result.current.booking.createAppointment(variables))

    await waitFor(() => expect(result.current.availability.blocks).toEqual([]))
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(result.current.booking.availabilityError).toBe("Este horario ya no está disponible.")
  })

  it("varios clics durante el envío registran una sola cita", async () => {
    let resolveCreate: (value: Appointment) => void = () => {}
    const createSpy = vi.spyOn(appointmentsApi, "createAppointment").mockReturnValue(
      new Promise<Appointment>((resolve) => {
        resolveCreate = resolve
      }),
    )

    const { result } = renderHook(() => useCreateAppointment(vi.fn()), createQueryWrapper())

    let first: Promise<boolean> = Promise.resolve(false)
    let second: Promise<boolean> = Promise.resolve(false)
    act(() => {
      first = result.current.createAppointment(variables)
      second = result.current.createAppointment(variables)
    })
    await act(async () => {
      resolveCreate({ id: "a1" } as Appointment)
      await Promise.all([first, second])
    })

    expect(createSpy).toHaveBeenCalledTimes(1)
    await expect(second).resolves.toBe(false)
  })

  describe("con documento adjunto", () => {
    const document = new File(["%PDF-1.4"], "Tesis.pdf", { type: "application/pdf" })
    const withDocument = { block, values: { ...variables.values, document } }

    it("sube el documento a la cita recién confirmada", async () => {
      vi.spyOn(appointmentsApi, "createAppointment").mockResolvedValue({ id: "a1" } as Appointment)
      const uploadSpy = vi
        .spyOn(appointmentsApi, "uploadDocument")
        .mockResolvedValue({ fileName: "Tesis.pdf" } as AppointmentDocument)

      const { result } = renderHook(() => useCreateAppointment(vi.fn()), createQueryWrapper())
      const created = await act(async () => result.current.createAppointment(withDocument))

      expect(created).toBe(true)
      expect(uploadSpy).toHaveBeenCalledWith("a1", document)
      expect(toast.warning).not.toHaveBeenCalled()
    })

    it("no sube nada si no hay documento", async () => {
      vi.spyOn(appointmentsApi, "createAppointment").mockResolvedValue({ id: "a1" } as Appointment)
      const uploadSpy = vi.spyOn(appointmentsApi, "uploadDocument")

      const { result } = renderHook(() => useCreateAppointment(vi.fn()), createQueryWrapper())
      await act(async () => result.current.createAppointment(variables))

      expect(uploadSpy).not.toHaveBeenCalled()
    })

    it("si la subida falla avisa y la cita sigue confirmada", async () => {
      vi.spyOn(appointmentsApi, "createAppointment").mockResolvedValue({ id: "a1" } as Appointment)
      vi.spyOn(appointmentsApi, "uploadDocument").mockRejectedValue(new Error("network"))

      const { result } = renderHook(() => useCreateAppointment(vi.fn()), createQueryWrapper())
      const created = await act(async () => result.current.createAppointment(withDocument))

      expect(created).toBe(true)
      expect(toast.success).toHaveBeenCalledWith("Cita confirmada", expect.any(Object))
      expect(toast.warning).toHaveBeenCalledWith(APPOINTMENT_DOCUMENT_TEXT.uploadError)
    })

    it("no intenta subir el documento si la cita no se creó", async () => {
      vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue(conflictError())
      const uploadSpy = vi.spyOn(appointmentsApi, "uploadDocument")

      const { result } = renderHook(() => useCreateAppointment(vi.fn()), createQueryWrapper())
      const created = await act(async () => result.current.createAppointment(withDocument))

      expect(created).toBe(false)
      expect(uploadSpy).not.toHaveBeenCalled()
    })

    it("invalida las citas después de subir el documento", async () => {
      vi.spyOn(appointmentsApi, "createAppointment").mockResolvedValue({ id: "a1" } as Appointment)
      vi.spyOn(appointmentsApi, "uploadDocument").mockResolvedValue({} as AppointmentDocument)
      const queryWrapper = createQueryWrapper()
      const invalidateSpy = vi.spyOn(queryWrapper.client, "invalidateQueries")

      const { result } = renderHook(() => useCreateAppointment(vi.fn()), queryWrapper)
      await act(async () => result.current.createAppointment(withDocument))

      const appointmentInvalidations = invalidateSpy.mock.calls.filter(
        ([filters]) => JSON.stringify(filters?.queryKey) === JSON.stringify(["appointments"]),
      )
      expect(appointmentInvalidations).toHaveLength(2)
    })
  })
})
