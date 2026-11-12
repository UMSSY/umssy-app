import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import * as downloadModule from "@/shared/utils/download-file"
import { APPOINTMENT_DETAIL_TEXT } from "../constants/appointments.constants"
import { appointmentsApi } from "../services/appointments.service"
import type { AppointmentDetail } from "../types/appointment-detail.types"
import { useAppointment } from "./use-appointment"
import { useCounterpartPhoto } from "./use-counterpart-photo"
import { useDownloadAppointmentDocument } from "./use-download-appointment-document"

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

describe("useAppointment", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("no pide nada sin una cita elegida", () => {
    const getById = vi.spyOn(appointmentsApi, "getById")

    const { result } = renderHook(() => useAppointment(null), createQueryWrapper())

    expect(getById).not.toHaveBeenCalled()
    expect(result.current).toEqual({ appointment: null, isLoading: false, error: null })
  })

  it("carga el detalle de la cita elegida", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue({ id: "a1" } as AppointmentDetail)

    const { result } = renderHook(() => useAppointment("a1"), createQueryWrapper())

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.appointment).toEqual({ id: "a1" }))
    expect(appointmentsApi.getById).toHaveBeenCalledWith("a1")
  })

  it("informa el error si falla la petición", async () => {
    vi.spyOn(appointmentsApi, "getById").mockRejectedValue(new Error("network"))

    const { result } = renderHook(() => useAppointment("a1"), createQueryWrapper())

    await waitFor(() => expect(result.current.error).toBe(APPOINTMENT_DETAIL_TEXT.loadError))
  })
})

describe("useCounterpartPhoto", () => {
  const createObjectURL = vi.fn(() => "blob:foto")
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("convierte la foto en una URL y la libera al desmontar", async () => {
    vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(new Blob(["png"]))

    const { result, unmount } = renderHook(() => useCounterpartPhoto("a1"), createQueryWrapper())

    await waitFor(() => expect(result.current).toBe("blob:foto"))
    unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:foto")
  })

  it("devuelve null si la otra persona no tiene foto", async () => {
    vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(null)

    const { result } = renderHook(() => useCounterpartPhoto("a1"), createQueryWrapper())

    await waitFor(() => expect(appointmentsApi.getCounterpartPhoto).toHaveBeenCalledWith("a1"))
    expect(result.current).toBeNull()
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it("no pide la foto sin una cita elegida", () => {
    const getPhoto = vi.spyOn(appointmentsApi, "getCounterpartPhoto")

    renderHook(() => useCounterpartPhoto(null), createQueryWrapper())

    expect(getPhoto).not.toHaveBeenCalled()
  })
})

describe("useDownloadAppointmentDocument", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(toast.error).mockClear()
  })

  it("descarga el documento con su nombre original", async () => {
    const file = new Blob(["%PDF"])
    vi.spyOn(appointmentsApi, "downloadDocument").mockResolvedValue(file)
    const download = vi.spyOn(downloadModule, "downloadFile").mockImplementation(() => undefined)

    const { result } = renderHook(() => useDownloadAppointmentDocument(), createQueryWrapper())
    await act(async () =>
      result.current.mutateAsync({ appointmentId: "a1", fileName: "Tesis.pdf" }),
    )

    expect(appointmentsApi.downloadDocument).toHaveBeenCalledWith("a1")
    expect(download).toHaveBeenCalledWith(file, "Tesis.pdf")
  })

  it("avisa si la descarga falla", async () => {
    vi.spyOn(appointmentsApi, "downloadDocument").mockRejectedValue(new Error("network"))

    const { result } = renderHook(() => useDownloadAppointmentDocument(), createQueryWrapper())
    await act(async () => {
      await result.current
        .mutateAsync({ appointmentId: "a1", fileName: "Tesis.pdf" })
        .catch(() => undefined)
    })

    expect(toast.error).toHaveBeenCalledWith(APPOINTMENT_DETAIL_TEXT.downloadError)
  })
})
