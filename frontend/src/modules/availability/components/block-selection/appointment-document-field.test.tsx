import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { APPOINTMENT_DOCUMENT_TEXT } from "../../constants/appointment-document.constants"
import { AppointmentDocumentField } from "./appointment-document-field"

const pdf = new File(["%PDF-1.4"], "Tesis_capitulo_2.pdf", { type: "application/pdf" })
Object.defineProperty(pdf, "size", { value: 2.4 * 1024 * 1024 })

function renderField(props: Partial<React.ComponentProps<typeof AppointmentDocumentField>> = {}) {
  const onSelect = vi.fn()
  const onRemove = vi.fn()
  render(
    <AppointmentDocumentField
      file={null}
      disabled={false}
      onSelect={onSelect}
      onRemove={onRemove}
      {...props}
    />,
  )
  return { onSelect, onRemove, user: userEvent.setup() }
}

describe("AppointmentDocumentField", () => {
  afterEach(() => {
    cleanup()
  })

  it("sin archivo muestra el botón para adjuntar y la ayuda de tipos y tamaño", () => {
    renderField()

    expect(screen.getByRole("button", { name: APPOINTMENT_DOCUMENT_TEXT.select })).toBeInTheDocument()
    expect(screen.getByText(APPOINTMENT_DOCUMENT_TEXT.hint)).toBeInTheDocument()
    expect(screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label)).toHaveAttribute(
      "accept",
      ".pdf,.png,.jpg,.jpeg",
    )
  })

  it("entrega el archivo elegido", async () => {
    const { onSelect, user } = renderField()

    await user.upload(screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label), pdf)

    expect(onSelect).toHaveBeenCalledWith(pdf)
  })

  it("con archivo muestra su tipo, nombre y tamaño, y permite quitarlo", async () => {
    const { onRemove, user } = renderField({ file: pdf })

    expect(screen.getByText("PDF")).toBeInTheDocument()
    expect(screen.getByText("Tesis_capitulo_2.pdf")).toBeInTheDocument()
    expect(screen.getByText("2.4 MB")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: APPOINTMENT_DOCUMENT_TEXT.removeLabel }))

    expect(onRemove).toHaveBeenCalledOnce()
  })

  it("muestra el error en lugar de la ayuda y lo enlaza al campo", () => {
    renderField({ file: pdf, error: "El archivo supera el límite de 5 MB." })

    const error = screen.getByText("El archivo supera el límite de 5 MB.")
    expect(screen.queryByText(APPOINTMENT_DOCUMENT_TEXT.hint)).not.toBeInTheDocument()
    expect(screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label)).toHaveAttribute(
      "aria-describedby",
      error.id,
    )
  })

  it("deshabilita adjuntar y quitar mientras se solicita la cita", () => {
    renderField({ file: pdf, disabled: true })

    expect(screen.getByRole("button", { name: APPOINTMENT_DOCUMENT_TEXT.removeLabel })).toBeDisabled()
    expect(screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label)).toBeDisabled()
  })

  it("abre el selector de archivos al presionar «Adjuntar documento»", async () => {
    const { user } = renderField()
    const input = screen.getByLabelText(APPOINTMENT_DOCUMENT_TEXT.label)
    const openPicker = vi.spyOn(input, "click")

    await user.click(screen.getByRole("button", { name: APPOINTMENT_DOCUMENT_TEXT.select }))

    expect(openPicker).toHaveBeenCalledOnce()
  })

  it("permite volver a elegir el mismo archivo después de quitarlo", async () => {
    const { onSelect, user } = renderField()
    const input = screen.getByLabelText<HTMLInputElement>(APPOINTMENT_DOCUMENT_TEXT.label)

    await user.upload(input, pdf)

    expect(onSelect).toHaveBeenCalledWith(pdf)
    expect(input.value).toBe("")
  })
})
