import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RequestAppointmentForm } from "./request-appointment-form"
import { REQUEST_APPOINTMENT_TEXT } from "../../constants/request-appointment.constants"

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
    expect(screen.getByLabelText(REQUEST_APPOINTMENT_TEXT.messageLabel)).toBeInTheDocument()
    expect(screen.getByText("0 / 300")).toBeInTheDocument()
    expect(screen.getByText(REQUEST_APPOINTMENT_TEXT.instantConfirmationNote)).toBeInTheDocument()
  })

  it("envía el tema y el mensaje cuando son válidos", async () => {
    const { onSubmit, user } = renderForm()

    await chooseTopic(user)
    await user.type(screen.getByLabelText(REQUEST_APPOINTMENT_TEXT.messageLabel), "Quiero revisar mi CV")
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    expect(screen.getByText("20 / 300")).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith({ orientationTypeId: "t1", message: "Quiero revisar mi CV" })
  })

  it("con más de 300 caracteres muestra el error junto al mensaje y no envía", async () => {
    const { onSubmit, user } = renderForm()

    await chooseTopic(user)
    fireEvent.change(screen.getByLabelText(REQUEST_APPOINTMENT_TEXT.messageLabel), {
      target: { value: "a".repeat(301) },
    })
    await user.click(screen.getByRole("button", { name: REQUEST_APPOINTMENT_TEXT.submit }))

    const error = screen.getByText(REQUEST_APPOINTMENT_TEXT.messageTooLong)
    expect(screen.getByLabelText(REQUEST_APPOINTMENT_TEXT.messageLabel)).toHaveAttribute(
      "aria-describedby",
      error.id,
    )
    expect(onSubmit).not.toHaveBeenCalled()
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
})
