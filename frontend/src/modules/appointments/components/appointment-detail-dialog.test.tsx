import { cleanup, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import { renderWithQuery } from "@/shared/testing/render-with-query"
import * as downloadModule from "@/shared/utils/download-file"
import { APPOINTMENT_DETAIL_TEXT, APPOINTMENTS_TEXT, JOIN_MEETING_TEXT } from "../constants/appointments.constants"
import { appointmentsApi } from "../services/appointments.service"
import type { AppointmentDetail } from "../types/appointment-detail.types"
import { AppointmentDetailDialog } from "./appointment-detail-dialog"

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

const MEETING_URL = "https://meet.jit.si/umssy-3f9c1a2e-5b7d-4c1e-9a2b-1c2d3e4f5a6b"

function makeAppointment(overrides: Partial<AppointmentDetail> = {}): AppointmentDetail {
  return {
    id: "a1",
    blockId: "b1",
    startAt: "2026-10-13T13:00:00.000Z",
    endAt: "2026-10-13T14:00:00.000Z",
    counterpart: { id: "mentor-1", fullName: "Ana Rojas", role: "mentor" },
    orientationType: { id: "t1", name: "Revisión de CV" },
    status: "CONFIRMED",
    message: "Quiero que revises mi CV antes de enviarlo.",
    requestedAt: "2026-10-08T22:42:00.000Z",
    document: {
      fileName: "Tesis_capitulo_2.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2.4 * 1024 * 1024,
      uploadedAt: "2026-10-08T22:43:00.000Z",
    },
    meetingUrl: MEETING_URL,
    cancellation: null,
    ...overrides,
  }
}

function renderDialog(appointmentId: string | null = "a1") {
  const onClose = vi.fn()
  renderWithQuery(<AppointmentDetailDialog appointmentId={appointmentId} onClose={onClose} />)
  return { onClose, user: userEvent.setup() }
}

describe("AppointmentDetailDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(makeAppointment())
    vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(null)
  })

  afterEach(() => {
    cleanup()
  })

  it("no se abre sin una cita elegida", () => {
    renderDialog(null)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(appointmentsApi.getById).not.toHaveBeenCalled()
  })

  it("muestra un estado de carga mientras pide la cita", () => {
    vi.mocked(appointmentsApi.getById).mockReturnValue(new Promise(() => undefined))

    renderDialog()

    expect(screen.getByRole("status", { name: APPOINTMENT_DETAIL_TEXT.loading })).toBeInTheDocument()
  })

  it("muestra un mensaje si falla la petición", async () => {
    vi.mocked(appointmentsApi.getById).mockRejectedValue(new Error("network"))

    renderDialog()

    expect(await screen.findByRole("alert")).toHaveTextContent(APPOINTMENT_DETAIL_TEXT.loadError)
  })

  it("muestra la persona, el estado y todos los datos de la cita", async () => {
    renderDialog()

    expect(await screen.findByRole("heading", { name: "Cita con Ana Rojas" })).toBeInTheDocument()
    expect(screen.getByText("Mentor · Revisión de CV")).toBeInTheDocument()
    expect(screen.getByText("Confirmada")).toBeInTheDocument()
    expect(screen.getByText("Martes 13 de octubre de 2026")).toBeInTheDocument()
    expect(screen.getByText("09:00 - 10:00 · Hora de Bolivia (GMT-4)")).toBeInTheDocument()
    expect(screen.getByText("Revisión de CV")).toBeInTheDocument()
    expect(screen.getByText("8 de octubre de 2026, 18:42")).toBeInTheDocument()
  })

  it("muestra las iniciales cuando la otra persona no tiene foto", async () => {
    renderDialog()

    expect(await screen.findByText("AR")).toBeInTheDocument()
    expect(appointmentsApi.getCounterpartPhoto).toHaveBeenCalledWith("a1")
  })

  it("muestra el mensaje del titulado", async () => {
    renderDialog()

    expect(await screen.findByText(APPOINTMENT_DETAIL_TEXT.messageTitle)).toBeInTheDocument()
    expect(screen.getByText("Quiero que revises mi CV antes de enviarlo.")).toBeInTheDocument()
  })

  it("muestra «Sin mensaje» en citas reservadas sin mensaje", async () => {
    vi.mocked(appointmentsApi.getById).mockResolvedValue(makeAppointment({ message: null }))

    renderDialog()

    expect(await screen.findByText(APPOINTMENT_DETAIL_TEXT.noMessage)).toBeInTheDocument()
  })

  it("muestra el documento y lo descarga con su nombre original", async () => {
    const file = new Blob(["%PDF"])
    vi.spyOn(appointmentsApi, "downloadDocument").mockResolvedValue(file)
    const download = vi.spyOn(downloadModule, "downloadFile").mockImplementation(() => undefined)
    const { user } = renderDialog()

    expect(await screen.findByText(APPOINTMENT_DETAIL_TEXT.documentTitle)).toBeInTheDocument()
    expect(screen.getByText("PDF")).toBeInTheDocument()
    expect(screen.getByText("Tesis_capitulo_2.pdf")).toBeInTheDocument()
    expect(screen.getByText("2.4 MB")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: APPOINTMENT_DETAIL_TEXT.download }))

    expect(appointmentsApi.downloadDocument).toHaveBeenCalledWith("a1")
    expect(download).toHaveBeenCalledWith(file, "Tesis_capitulo_2.pdf")
  })

  it("sin documento no muestra la sección", async () => {
    vi.mocked(appointmentsApi.getById).mockResolvedValue(makeAppointment({ document: null }))

    renderDialog()

    await screen.findByRole("heading", { name: "Cita con Ana Rojas" })
    expect(screen.queryByText(APPOINTMENT_DETAIL_TEXT.documentTitle)).not.toBeInTheDocument()
  })

  it("el titulado ve el enlace al perfil del mentor", async () => {
    renderDialog()

    expect(
      await screen.findByRole("link", { name: APPOINTMENT_DETAIL_TEXT.mentorProfile }),
    ).toHaveAttribute("href", "/mentors/mentor-1")
  })

  it("el mentor no ve el enlace al perfil", async () => {
    vi.mocked(appointmentsApi.getById).mockResolvedValue(
      makeAppointment({
        counterpart: { id: "student-1", fullName: "Luis Flores", role: "student" },
      }),
    )

    renderDialog()

    expect(await screen.findByText("Titulado · Revisión de CV")).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: APPOINTMENT_DETAIL_TEXT.mentorProfile }),
    ).not.toBeInTheDocument()
  })

  it("se cierra con «Cerrar»", async () => {
    const { onClose, user } = renderDialog()

    await screen.findByRole("heading", { name: "Cita con Ana Rojas" })
    await user.click(screen.getByRole("button", { name: APPOINTMENT_DETAIL_TEXT.close }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe("AppointmentDetailDialog: cita cancelada", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(null)
  })

  afterEach(() => {
    cleanup()
  })

  it("muestra «Cancelada por ti» cuando el usuario canceló", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(
      makeAppointment({
        status: "CANCELLED",
        meetingUrl: null,
        cancellation: { cancelledBy: "MENTOR", cancelledByMe: true, reason: null, cancelledAt: "2026-10-10T00:00:00.000Z" },
      }),
    )

    renderDialog()

    expect(await screen.findByText("Cancelada por ti")).toBeInTheDocument()
  })

  it("muestra el motivo de la cancelación cuando existe", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(
      makeAppointment({
        status: "CANCELLED",
        meetingUrl: null,
        cancellation: {
          cancelledBy: "STUDENT",
          cancelledByMe: false,
          reason: "Tuve un imprevisto de salud",
          cancelledAt: "2026-10-10T00:00:00.000Z",
        },
      }),
    )

    renderDialog()

    expect(await screen.findByText(APPOINTMENT_DETAIL_TEXT.cancellationReasonTitle)).toBeInTheDocument()
    expect(screen.getByText("Tuve un imprevisto de salud")).toBeInTheDocument()
  })

  it("no muestra la sección de motivo si no hay razón registrada", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(
      makeAppointment({
        status: "CANCELLED",
        meetingUrl: null,
        cancellation: { cancelledBy: "STUDENT", cancelledByMe: false, reason: null, cancelledAt: "2026-10-10T00:00:00.000Z" },
      }),
    )

    renderDialog()

    await screen.findByRole("heading", { name: "Cita con Ana Rojas" })
    expect(screen.queryByText(APPOINTMENT_DETAIL_TEXT.cancellationReasonTitle)).not.toBeInTheDocument()
  })

  it("no muestra «Cancelar cita» ni «Unirse a la reunión»", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(
      makeAppointment({
        status: "CANCELLED",
        meetingUrl: null,
        cancellation: { cancelledBy: "MENTOR", cancelledByMe: false, reason: null, cancelledAt: "2026-10-10T00:00:00.000Z" },
      }),
    )

    renderDialog()

    await screen.findByRole("heading", { name: "Cita con Ana Rojas" })
    expect(screen.queryByText(JOIN_MEETING_TEXT.join)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /cancelar cita/i })).not.toBeInTheDocument()
  })

  it("el titulado ve «Reservar otro horario» cuando el mentor canceló, y abre la agenda de ese mentor", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(
      makeAppointment({
        status: "CANCELLED",
        meetingUrl: null,
        cancellation: { cancelledBy: "MENTOR", cancelledByMe: false, reason: null, cancelledAt: "2026-10-10T00:00:00.000Z" },
      }),
    )

    renderDialog()

    const rebook = await screen.findByRole("link", { name: "Reservar otro horario" })
    expect(rebook).toHaveAttribute("href", "/mentors/mentor-1")
    expect(screen.queryByRole("link", { name: APPOINTMENT_DETAIL_TEXT.mentorProfile })).not.toBeInTheDocument()
  })

  it("el mentor que canceló no ve «Reservar otro horario»", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(
      makeAppointment({
        status: "CANCELLED",
        meetingUrl: null,
        counterpart: { id: "student-1", fullName: "Luis Flores", role: "student" },
        cancellation: { cancelledBy: "MENTOR", cancelledByMe: true, reason: null, cancelledAt: "2026-10-10T00:00:00.000Z" },
      }),
    )

    renderDialog()

    await screen.findByRole("heading", { name: "Cita con Luis Flores" })
    expect(screen.queryByRole("link", { name: "Reservar otro horario" })).not.toBeInTheDocument()
  })

  it("no muestra «Reservar otro horario» cuando canceló el titulado", async () => {
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(
      makeAppointment({
        status: "CANCELLED",
        meetingUrl: null,
        cancellation: { cancelledBy: "STUDENT", cancelledByMe: false, reason: null, cancelledAt: "2026-10-10T00:00:00.000Z" },
      }),
    )

    renderDialog()

    expect(await screen.findByRole("link", { name: APPOINTMENT_DETAIL_TEXT.mentorProfile })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Reservar otro horario" })).not.toBeInTheDocument()
  })
})

describe("AppointmentDetailDialog: foto, tema y descarga", () => {
  class LoadedImage {
    complete = true
    naturalWidth = 1
    src = ""
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(toast.error).mockClear()
    vi.spyOn(appointmentsApi, "getById").mockResolvedValue(makeAppointment())
    vi.spyOn(appointmentsApi, "getCounterpartPhoto").mockResolvedValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    cleanup()
  })

  it("muestra la foto de perfil de la otra persona cuando tiene una", async () => {
    vi.stubGlobal("Image", LoadedImage)
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:foto-ana")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    vi.mocked(appointmentsApi.getCounterpartPhoto).mockResolvedValue(
      new Blob(["png"], { type: "image/png" }),
    )

    renderDialog()

    expect(await screen.findByRole("img", { name: "Foto de perfil de Ana Rojas" })).toHaveAttribute(
      "src",
      "blob:foto-ana",
    )
  })

  it("no pide la foto hasta tener los datos de la cita", () => {
    vi.mocked(appointmentsApi.getById).mockReturnValue(new Promise(() => undefined))

    renderDialog()

    expect(appointmentsApi.getCounterpartPhoto).not.toHaveBeenCalled()
  })

  it("muestra una alternativa cuando la cita no tiene tema", async () => {
    vi.mocked(appointmentsApi.getById).mockResolvedValue(makeAppointment({ orientationType: null }))

    renderDialog()

    expect(await screen.findByText(`Mentor · ${APPOINTMENTS_TEXT.noTopic}`)).toBeInTheDocument()
    expect(screen.getAllByText(APPOINTMENTS_TEXT.noTopic)).toHaveLength(1)
  })

  it("deshabilita «Descargar» mientras baja el documento", async () => {
    vi.spyOn(appointmentsApi, "downloadDocument").mockReturnValue(new Promise(() => undefined))
    const { user } = renderDialog()

    await user.click(await screen.findByRole("button", { name: APPOINTMENT_DETAIL_TEXT.download }))

    expect(screen.getByRole("button", { name: APPOINTMENT_DETAIL_TEXT.downloading })).toBeDisabled()
  })

  it("avisa si la descarga falla y deja volver a intentarlo", async () => {
    vi.spyOn(appointmentsApi, "downloadDocument").mockRejectedValue(new Error("network"))
    const { user } = renderDialog()

    await user.click(await screen.findByRole("button", { name: APPOINTMENT_DETAIL_TEXT.download }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(APPOINTMENT_DETAIL_TEXT.downloadError),
    )
    expect(screen.getByRole("button", { name: APPOINTMENT_DETAIL_TEXT.download })).toBeEnabled()
  })

  it("en una cita confirmada muestra «Unirse a la reunión», que abre la sala en una pestaña nueva", async () => {
    renderDialog()

    const join = await screen.findByRole("link", { name: JOIN_MEETING_TEXT.join })
    expect(join).toHaveAttribute("href", MEETING_URL)
    expect(join).toHaveAttribute("target", "_blank")
    expect(join).toHaveAttribute("rel", "noopener noreferrer")
  })

  it.each(["CANCELLED", "COMPLETED"] as const)("en una cita %s no muestra «Unirse a la reunión»", async (status) => {
    vi.mocked(appointmentsApi.getById).mockResolvedValue(makeAppointment({ status, meetingUrl: null }))

    renderDialog()

    await screen.findByRole("heading", { name: "Cita con Ana Rojas" })
    expect(screen.queryByText(JOIN_MEETING_TEXT.join)).not.toBeInTheDocument()
  })

  it("si la cita confirmada no tiene enlace, avisa que no se pudo abrir la reunión y conserva su estado", async () => {
    vi.mocked(appointmentsApi.getById).mockResolvedValue(makeAppointment({ meetingUrl: null }))
    const { user } = renderDialog()

    await user.click(await screen.findByRole("button", { name: JOIN_MEETING_TEXT.join }))

    expect(screen.getByRole("alert")).toHaveTextContent(JOIN_MEETING_TEXT.unavailable)
    expect(screen.getByText("Confirmada")).toBeInTheDocument()
  })

  it("el mentor también ve «Unirse a la reunión»", async () => {
    vi.mocked(appointmentsApi.getById).mockResolvedValue(
      makeAppointment({ counterpart: { id: "student-1", fullName: "Luis Pérez", role: "student" } }),
    )

    renderDialog()

    expect(await screen.findByRole("link", { name: JOIN_MEETING_TEXT.join })).toHaveAttribute("href", MEETING_URL)
  })

  it("se cierra con la tecla Escape", async () => {
    const { onClose, user } = renderDialog()

    await screen.findByRole("heading", { name: "Cita con Ana Rojas" })
    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalledOnce()
  })
})
