import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { toast } from "sonner"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import { useCreateAppointment } from "./use-create-appointment"
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

  it("con otros errores muestra el detail o un mensaje genérico sin marcar el bloque", async () => {
    vi.spyOn(appointmentsApi, "createAppointment")
      .mockRejectedValueOnce({ response: { data: { detail: "El tema de la sesión no es válido" } } })
      .mockRejectedValueOnce(new Error("Network error"))
    const onConflict = vi.fn()

    const { result } = renderHook(() => useCreateAppointment(onConflict), createQueryWrapper())

    await act(async () => result.current.createAppointment(variables))
    await act(async () => result.current.createAppointment(variables))

    expect(toast.error).toHaveBeenNthCalledWith(1, "El tema de la sesión no es válido")
    expect(toast.error).toHaveBeenNthCalledWith(2, "No se pudo solicitar la cita. Intenta de nuevo.")
    expect(onConflict).not.toHaveBeenCalled()
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
