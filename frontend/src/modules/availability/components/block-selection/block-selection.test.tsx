import { cleanup, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import Link from "next/link"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithQuery } from "@/shared/testing/render-with-query"
import { getWeekRange } from "@/shared/utils/date-time"
import { appointmentsApi, type Appointment, type AppointmentDocument } from "@/modules/appointments"
import { APPOINTMENT_DOCUMENT_TEXT } from "../../constants/appointment-document.constants"
import { BlockSelection } from "./block-selection"
import { BLOCK_SELECTION_TEXT } from "../../constants/block-selection.constants"
import {
  LEAVE_REQUEST_TEXT,
  REQUEST_APPOINTMENT_TEXT,
} from "../../constants/request-appointment.constants"
import type { AvailabilityBlock } from "../../types/availability-block.types"

const push = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }))
vi.mock("@/modules/mentorship", () => ({
  useMentorProfile: () => ({
    data: {
      orientationTypes: [
        { id: "t1", name: "Revisión de CV", description: null },
        { id: "t2", name: "Entrevistas", description: null },
      ],
    },
    isPending: false,
  }),
}))

const tuesdayBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2026-10-06T22:00:00.000Z",
  endAt: "2026-10-06T23:00:00.000Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

const saturdayBlock: AvailabilityBlock = {
  ...tuesdayBlock,
  id: "2",
  startAt: "2026-10-10T14:00:00.000Z",
  endAt: "2026-10-10T15:00:00.000Z",
}

const weekRange = getWeekRange(tuesdayBlock.startAt)
const tuesdayButton = "libre, 18:00 a 19:00"
const saturdayButton = "libre, 10:00 a 11:00"

const renderSelection = (fetchFreeBlocks: () => Promise<AvailabilityBlock[]>) =>
  renderWithQuery(
    <>
      <Link href="/mentors/m1">Volver al perfil</Link>
      <BlockSelection
        mentorId="m1"
        blocks={[tuesdayBlock, saturdayBlock]}
        weekRange={weekRange}
        fetchFreeBlocks={fetchFreeBlocks}
      />
    </>
  )

async function selectTuesday(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: tuesdayButton }))
  await screen.findByText("Martes 6 de octubre de 2026")
}

async function chooseTopic(user: ReturnType<typeof userEvent.setup>, topic: string) {
  await user.click(screen.getByLabelText(/Tema de la sesión/))
  await user.click(await screen.findByRole("option", { name: topic }))
}

async function fillRequest(user: ReturnType<typeof userEvent.setup>) {
  await chooseTopic(user, "Revisión de CV")
  await user.type(screen.getByLabelText(/Mensaje para el mentor/), "Quiero revisar mi CV")
}

describe("BlockSelection", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    push.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it("resalta en Tu selección el bloque libre marcado y habilita Solicitar cita", async () => {
    const fetchFreeBlocks = vi.fn().mockResolvedValue([tuesdayBlock, saturdayBlock])
    renderSelection(fetchFreeBlocks)

    await userEvent.click(screen.getByRole("button", { name: tuesdayButton }))

    await waitFor(() => {
      expect(screen.getByText("Martes 6 de octubre de 2026")).toBeInTheDocument()
    })
    expect(fetchFreeBlocks).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit })).toBeEnabled()
    expect(screen.getByRole("button", { name: tuesdayButton })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: saturdayButton })).not.toHaveAttribute("aria-pressed")
  })

  it("sin bloque elegido muestra Solicitar cita deshabilitado", () => {
    renderSelection(vi.fn().mockResolvedValue([]))

    expect(screen.getByRole("button", { name: BLOCK_SELECTION_TEXT.requestAppointment })).toBeDisabled()
  })

  it("cambia la selección al marcar otro bloque", async () => {
    const fetchFreeBlocks = vi.fn().mockResolvedValue([tuesdayBlock, saturdayBlock])
    renderSelection(fetchFreeBlocks)

    await userEvent.click(screen.getByRole("button", { name: tuesdayButton }))
    await userEvent.click(screen.getByRole("button", { name: saturdayButton }))

    await waitFor(() => {
      expect(screen.getByText("Sábado 10 de octubre de 2026")).toBeInTheDocument()
    })
    expect(screen.queryByText("Martes 6 de octubre de 2026")).not.toBeInTheDocument()
  })

  it("muestra no disponible y quita de la grilla un bloque tomado por otro", async () => {
    const fetchFreeBlocks = vi.fn().mockResolvedValue([saturdayBlock])
    renderSelection(fetchFreeBlocks)

    await userEvent.click(screen.getByRole("button", { name: tuesdayButton }))

    await waitFor(() => {
      expect(screen.getByText(BLOCK_SELECTION_TEXT.unavailableTitle)).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: tuesdayButton })).not.toBeInTheDocument()
    expect(screen.getByText(BLOCK_SELECTION_TEXT.empty)).toBeInTheDocument()
  })

  it("muestra en Tema de la sesión los tipos de orientación del mentor", async () => {
    const user = userEvent.setup()
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await user.click(screen.getByLabelText(/Tema de la sesión/))

    expect(await screen.findByRole("option", { name: "Revisión de CV" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Entrevistas" })).toBeInTheDocument()
  })

  it("sin tema no crea la cita y muestra el error junto al campo", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, "createAppointment")
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    expect(screen.getByText(REQUEST_APPOINTMENT_TEXT.missingTopic)).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("con tema y mensaje confirma la cita y el horario deja de estar seleccionado", async () => {
    const user = userEvent.setup()
    const createSpy = vi
      .spyOn(appointmentsApi, "createAppointment")
      .mockResolvedValue({ id: "a1" } as Appointment)
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await fillRequest(user)
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    await waitFor(() => expect(screen.getByText(BLOCK_SELECTION_TEXT.empty)).toBeInTheDocument())
    expect(createSpy).toHaveBeenCalledWith({
      blockId: "1",
      orientationTypeId: "t1",
      message: "Quiero revisar mi CV",
    })
  })

  it("con documento adjunto confirma la cita y sube el archivo", async () => {
    const user = userEvent.setup()
    vi.spyOn(appointmentsApi, "createAppointment").mockResolvedValue({ id: "a1" } as Appointment)
    const uploadSpy = vi
      .spyOn(appointmentsApi, "uploadDocument")
      .mockResolvedValue({} as AppointmentDocument)
    const pdf = new File(["%PDF-1.4"], "Tesis.pdf", { type: "application/pdf" })
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await fillRequest(user)
    await user.upload(screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label), pdf)
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    await waitFor(() => expect(screen.getByText(BLOCK_SELECTION_TEXT.empty)).toBeInTheDocument())
    expect(uploadSpy).toHaveBeenCalledWith("a1", pdf)
  })

  it("si falla la subida del documento la cita queda confirmada y se avisa", async () => {
    const user = userEvent.setup()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.warning).mockClear()
    vi.spyOn(appointmentsApi, "createAppointment").mockResolvedValue({ id: "a1" } as Appointment)
    vi.spyOn(appointmentsApi, "uploadDocument").mockRejectedValue(new Error("network"))
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await fillRequest(user)
    await user.upload(
      screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label),
      new File(["%PDF-1.4"], "Tesis.pdf", { type: "application/pdf" }),
    )
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    await waitFor(() => expect(screen.getByText(BLOCK_SELECTION_TEXT.empty)).toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledWith(REQUEST_APPOINTMENT_TEXT.confirmed, expect.any(Object))
    expect(toast.warning).toHaveBeenCalledWith(APPOINTMENT_DOCUMENT_TEXT.uploadError)
  })

  it("sin mensaje no crea la cita y muestra el error junto al campo", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, "createAppointment")
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await chooseTopic(user, "Revisión de CV")
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    expect(screen.getByText(REQUEST_APPOINTMENT_TEXT.missingMessage)).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("con 409 marca el bloque como no disponible y permite elegir otro", async () => {
    const user = userEvent.setup()
    vi.spyOn(appointmentsApi, "createAppointment").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { detail: "Este horario ya fue reservado" } },
    })
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock, saturdayBlock]))

    await selectTuesday(user)
    await fillRequest(user)
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    await waitFor(() => {
      expect(screen.getByText(BLOCK_SELECTION_TEXT.unavailableTitle)).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: tuesdayButton })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: saturdayButton })).toBeEnabled()
  })

  it("advierte al salir con datos sin enviar y permite quedarse o salir", async () => {
    const user = userEvent.setup()
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await chooseTopic(user, "Revisión de CV")
    await user.click(screen.getByRole("link", { name: "Volver al perfil" }))

    expect(await screen.findByText(LEAVE_REQUEST_TEXT.title)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: LEAVE_REQUEST_TEXT.stay }))
    expect(push).not.toHaveBeenCalled()

    await user.click(screen.getByRole("link", { name: "Volver al perfil" }))
    await user.click(await screen.findByRole("button", { name: LEAVE_REQUEST_TEXT.leave }))
    expect(push).toHaveBeenCalledWith("/mentors/m1")
  })

  it("no advierte al salir si el formulario está vacío", async () => {
    const user = userEvent.setup()
    renderSelection(vi.fn().mockResolvedValue([tuesdayBlock]))

    await selectTuesday(user)
    await user.click(screen.getByRole("link", { name: "Volver al perfil" }))

    expect(screen.queryByText(LEAVE_REQUEST_TEXT.title)).not.toBeInTheDocument()
  })
})
