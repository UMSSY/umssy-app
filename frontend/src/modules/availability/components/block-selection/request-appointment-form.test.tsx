import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RequestAppointmentForm } from "./request-appointment-form"
import { REQUEST_APPOINTMENT_TEXT } from "../../constants/request-appointment.constants"
import { APPOINTMENT_DOCUMENT_TEXT } from "../../constants/appointment-document.constants"
import { FILE_VALIDATION_MESSAGES } from "@/modules/profile"

const messageLabel = new RegExp(REQUEST_APPOINTMENT_TEXT.messageLabel)

const makeFile = (name: string, type: string, size = 1024) => {
  const file = new File(["x"], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

const orientationTypes = [{ id: "t1", name: "Revisión de CV", description: null }]

function renderForm(props: Partial<React.ComponentProps<typeof RequestAppointmentForm>> = {}) {
  const onSubmit = vi.fn()
  const onDirtyChange = vi.fn()
  render(
    <RequestAppointmentForm
      orientationTypes={orientationTypes}
      isLoadingTopics={false}
      isSubmitting={false}
      onSubmit={onSubmit}
      onDirtyChange={onDirtyChange}
      {...props}
    />
  )
  return { onSubmit, onDirtyChange, user: userEvent.setup() }
}

async function chooseTopic(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/Tema de la sesión/))
  await user.click(await screen.findByRole("option", { name: "Revisión de CV" }))
}

describe("RequestAppointmentForm", () => {
  afterEach(() => {
    cleanup()
  })

  it("muestra los campos, el contador y la nota de confirmación", () => {
    renderForm()

    expect(screen.getByLabelText(/Tema de la sesión/)).toBeInTheDocument()
    expect(screen.getByLabelText(messageLabel)).toBeInTheDocument()
    expect(screen.getByText("0 / 300")).toBeInTheDocument()
    expect(screen.getByText(REQUEST_APPOINTMENT_TEXT.instantConfirmationNote)).toBeInTheDocument()
  })

  it("envía el tema y el mensaje cuando son válidos", async () => {
    const { onSubmit, user } = renderForm()

    await chooseTopic(user)
    await user.type(screen.getByLabelText(messageLabel), "Quiero revisar mi CV")
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    expect(screen.getByText("20 / 300")).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith({
      orientationTypeId: "t1",
      message: "Quiero revisar mi CV",
      document: null,
    })
  })

  it("con más de 300 caracteres muestra el error junto al mensaje y no envía", async () => {
    const { onSubmit, user } = renderForm()

    await chooseTopic(user)
    fireEvent.change(screen.getByLabelText(messageLabel), {
      target: { value: "a".repeat(301) },
    })
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    const error = screen.getByText(REQUEST_APPOINTMENT_TEXT.messageTooLong)
    expect(screen.getByLabelText(messageLabel)).toHaveAttribute(
      "aria-describedby",
      error.id,
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("sin mensaje muestra el error junto al campo y no envía", async () => {
    const { onSubmit, user } = renderForm()

    await chooseTopic(user)
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    const error = screen.getByText(REQUEST_APPOINTMENT_TEXT.missingMessage)
    expect(screen.getByLabelText(messageLabel)).toHaveAttribute("aria-describedby", error.id)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("marca el mensaje como obligatorio", () => {
    renderForm()

    expect(screen.getByLabelText(messageLabel)).toHaveAttribute("aria-required", "true")
  })

  it("avisa si el formulario tiene datos cargados", async () => {
    const { onDirtyChange, user } = renderForm()

    await chooseTopic(user)

    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
  })

  it("deshabilita el envío mientras se solicita la cita", () => {
    renderForm({ isSubmitting: true })

    expect(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submitting })).toBeDisabled()
  })

  it("envía el documento adjunto junto con el tema y el mensaje", async () => {
    const { onSubmit, user } = renderForm()
    const pdf = makeFile("Tesis.pdf", "application/pdf")

    await chooseTopic(user)
    await user.type(screen.getByLabelText(messageLabel), "Revisa mi tesis")
    await user.upload(screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label), pdf)
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    expect(onSubmit).toHaveBeenCalledWith({
      orientationTypeId: "t1",
      message: "Revisa mi tesis",
      document: pdf,
    })
  })

  it("permite quitar el documento antes de solicitar la cita", async () => {
    const { onSubmit, user } = renderForm()

    await chooseTopic(user)
    await user.type(screen.getByLabelText(messageLabel), "Hola")
    await user.upload(
      screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label),
      makeFile("Tesis.pdf", "application/pdf"),
    )
    await user.click(screen.getByRole("button", { name: APPOINTMENT_DOCUMENT_TEXT.removeLabel }))
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    expect(screen.queryByText("Tesis.pdf")).not.toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith({ orientationTypeId: "t1", message: "Hola", document: null })
  })

  it.each([
    ["de otro tipo", makeFile("notas.docx", "application/msword"), FILE_VALIDATION_MESSAGES.invalidCertificateType],
    ["de más de 5 MB", makeFile("cv.pdf", "application/pdf", 5 * 1024 * 1024 + 1), FILE_VALIDATION_MESSAGES.fileTooLarge],
  ])("con un archivo %s muestra el error y no deja solicitar", async (_case, file, message) => {
    const { onSubmit } = renderForm()
    const user = userEvent.setup({ applyAccept: false })

    await user.upload(screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label), file)

    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit })).toBeDisabled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("al quitar un archivo inválido vuelve a habilitar el envío", async () => {
    renderForm()
    const user = userEvent.setup({ applyAccept: false })
    const input = screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label)

    await user.upload(input, makeFile("notas.docx", "application/msword"))
    await user.click(screen.getByRole("button", { name: APPOINTMENT_DOCUMENT_TEXT.removeLabel }))

    expect(screen.queryByText(FILE_VALIDATION_MESSAGES.invalidCertificateType)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit })).toBeEnabled()
  })

  it("avisa que hay datos cargados al adjuntar solo un documento", async () => {
    const { onDirtyChange, user } = renderForm()

    await user.upload(
      screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label),
      makeFile("Tesis.pdf", "application/pdf"),
    )

    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
  })
})
