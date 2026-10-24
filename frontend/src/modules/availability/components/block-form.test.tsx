import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BlockForm } from "./block-form"

// Ahora fijo: jueves 8 de octubre de 2026, 10:00 en Bolivia (14:00 UTC).
const FIXED_NOW = new Date("2026-10-08T14:00:00Z")

function renderForm(props: Partial<React.ComponentProps<typeof BlockForm>> = {}) {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  render(<BlockForm mode="create" onSubmit={onSubmit} onCancel={onCancel} {...props} />)
  return { onSubmit, onCancel, user: userEvent.setup() }
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, day: string, start: string, end: string) {
  await user.click(screen.getByRole("button", { name: day }))
  await selectTime(user, /Hora de inicio/, start)
  await selectTime(user, /Hora de fin/, end)
}

async function selectTime(user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) {
  await user.click(screen.getByLabelText(label))
  await user.click(await screen.findByRole("option", { name: value }))
}

describe("BlockForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("renderiza el modo creación con sus campos y botones", () => {
    renderForm()

    expect(screen.getByText("Nuevo bloque de disponibilidad")).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha/)).toHaveValue("")
    expect(screen.getByText("Los días anteriores a hoy no se pueden elegir.")).toBeInTheDocument()
    expect(screen.queryByText(/Horario en hora de Bolivia/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Hora de inicio/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hora de fin/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar bloque" })).toBeInTheDocument()
  })

  it("deshabilita los días pasados y permite el día actual", () => {
    renderForm()

    expect(screen.getByRole("button", { name: "miércoles, 7 de octubre de 2026" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Hoy, jueves, 8 de octubre de 2026" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "viernes, 9 de octubre de 2026" })).toBeEnabled()
  })

  it("usa el día de Bolivia aunque en UTC ya sea el día siguiente", () => {
    // 22:00 del 8 de octubre en Bolivia = 02:00 UTC del 9 de octubre.
    vi.setSystemTime(new Date("2026-10-09T02:00:00Z"))
    renderForm()

    expect(screen.getByRole("button", { name: /jueves, 8 de octubre de 2026/ })).toBeEnabled()
  })

  it("ofrece horas de 07:00 a 22:00 cada 30 minutos en una lista compacta", async () => {
    const { user } = renderForm()

    await user.click(screen.getByLabelText(/Hora de inicio/))
    const options = (await screen.findAllByRole("option")).map((option) => option.textContent)

    expect(options).toHaveLength(31)
    expect(options[0]).toBe("07:00")
    expect(options[1]).toBe("07:30")
    expect(options.at(-1)).toBe("22:00")
    expect(screen.getByRole("listbox").closest('[data-slot="select-content"]')).toHaveClass("max-h-[min(200px,var(--available-height))]")
  })

  it("muestra los campos obligatorios sin llamar a onSubmit", async () => {
    const { onSubmit, user } = renderForm()

    await user.click(screen.getByRole("button", { name: "Guardar bloque" }))

    expect(screen.getByText("Selecciona una fecha")).toBeInTheDocument()
    expect(screen.getByText("Selecciona la hora de inicio")).toBeInTheDocument()
    expect(screen.getByText("Selecciona la hora de fin")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("deshabilita las horas de fin iguales o anteriores a la de inicio", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "martes, 13 de octubre de 2026" }))
    await selectTime(user, /Hora de inicio/, "20:00")
    await user.click(screen.getByLabelText(/Hora de fin/))

    expect(await screen.findByRole("option", { name: "18:00" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "20:00" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "20:30" })).not.toHaveAttribute("aria-disabled", "true")
  })

  it("deshabilita las horas de inicio iguales o posteriores a la de fin", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "martes, 13 de octubre de 2026" }))
    await selectTime(user, /Hora de fin/, "12:00")
    await user.click(screen.getByLabelText(/Hora de inicio/))

    expect(await screen.findByRole("option", { name: "12:00" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "15:00" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "11:30" })).not.toHaveAttribute("aria-disabled", "true")
  })

  it("con la fecha de hoy deshabilita las horas de inicio y fin que ya pasaron", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "Hoy, jueves, 8 de octubre de 2026" }))
    await user.click(screen.getByLabelText(/Hora de inicio/))
    expect(await screen.findByRole("option", { name: "08:00" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "10:00" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "10:30" })).not.toHaveAttribute("aria-disabled", "true")
    await user.keyboard("{Escape}")

    await user.click(screen.getByLabelText(/Hora de fin/))
    expect(await screen.findByRole("option", { name: "09:30" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "10:30" })).not.toHaveAttribute("aria-disabled", "true")
  })

  it("en otra fecha no deshabilita las horas de la mañana", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "martes, 13 de octubre de 2026" }))
    await user.click(screen.getByLabelText(/Hora de inicio/))

    expect(await screen.findByRole("option", { name: "07:00" })).not.toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("option", { name: "22:00" })).toHaveAttribute("aria-disabled", "true")
  })

  it("limpia las horas elegidas si al cambiar a hoy ya pasaron", async () => {
    const { user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "08:00", "09:00")
    await user.click(screen.getByRole("button", { name: "Hoy, jueves, 8 de octubre de 2026" }))

    expect(screen.getByLabelText(/Hora de inicio/)).toHaveTextContent("--:--")
    expect(screen.getByLabelText(/Hora de fin/)).toHaveTextContent("--:--")
  })

  it("mantiene las horas elegidas si al cambiar de fecha siguen siendo válidas", async () => {
    const { user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "15:00", "16:00")
    await user.click(screen.getByRole("button", { name: "Hoy, jueves, 8 de octubre de 2026" }))

    expect(screen.getByLabelText(/Hora de inicio/)).toHaveTextContent("15:00")
    expect(screen.getByLabelText(/Hora de fin/)).toHaveTextContent("16:00")
  })

  it("muestra el error de inicio pasado si la hora pasa con el formulario abierto", async () => {
    const { onSubmit, user } = renderForm()

    await fillForm(user, "Hoy, jueves, 8 de octubre de 2026", "10:30", "11:00")
    vi.setSystemTime(new Date("2026-10-08T14:45:00Z"))
    await user.click(screen.getByRole("button", { name: "Guardar bloque" }))

    const error = screen.getByText("La hora de inicio ya pasó")
    expect(screen.getByLabelText(/Hora de inicio/)).toHaveAttribute("aria-describedby", error.id)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("limpia el error del campo cuando el usuario lo corrige", async () => {
    const { user } = renderForm()

    await fillForm(user, "Hoy, jueves, 8 de octubre de 2026", "10:30", "11:00")
    vi.setSystemTime(new Date("2026-10-08T14:45:00Z"))
    await user.click(screen.getByRole("button", { name: "Guardar bloque" }))
    await selectTime(user, /Hora de fin/, "12:00")
    await selectTime(user, /Hora de inicio/, "11:00")

    expect(screen.queryByText("La hora de inicio ya pasó")).not.toBeInTheDocument()
  })

  it("muestra la fecha elegida en el campo Fecha", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "martes, 13 de octubre de 2026" }))

    expect(screen.getByLabelText(/Fecha/)).toHaveValue("Martes 13 de octubre de 2026")
  })

  it("envía el bloque en UTC cuando es válido", async () => {
    const { onSubmit, user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("button", { name: "Guardar bloque" }))

    expect(onSubmit).toHaveBeenCalledWith({
      startAt: "2026-10-13T22:00:00.000Z",
      endAt: "2026-10-14T00:00:00.000Z",
    })
  })

  it("Cancelar llama a onCancel sin enviar el formulario", async () => {
    const { onSubmit, onCancel, user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("en modo edición permite cambiar las horas y conserva el día original de solo lectura", async () => {
    const { onSubmit, user } = renderForm({
      mode: "edit",
      initialValues: { startAt: "2026-10-13T22:00:00.000Z", endAt: "2026-10-14T00:00:00.000Z" },
    })

    expect(screen.getByText("Editar bloque")).toBeInTheDocument()
    expect(screen.getByLabelText(/Día/)).toHaveValue("13/10/2026")
    expect(screen.getByLabelText(/Día/)).toHaveAttribute("readonly")
    expect(screen.getByText("Martes 13 de octubre")).toBeInTheDocument()
    expect(screen.getByLabelText(/Desde/)).toHaveTextContent("18:00")
    expect(screen.getByLabelText(/Hasta/)).toHaveTextContent("20:00")
    expect(screen.queryByText(/Horario en hora de Bolivia/)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/Día/), "15102026")
    expect(screen.getByLabelText(/Día/)).toHaveValue("13/10/2026")
    await selectTime(user, /Desde/, "17:00")
    await selectTime(user, /Hasta/, "19:00")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    expect(onSubmit).toHaveBeenCalledWith({
      startAt: "2026-10-13T21:00:00.000Z",
      endAt: "2026-10-13T23:00:00.000Z",
    })
  })

  it("en modo edición muestra el chip rosa y el borde de tarjeta, oculta el calendario y pinta el botón rojo", () => {
    renderForm({
      mode: "edit",
      initialValues: { startAt: "2026-10-13T22:00:00.000Z", endAt: "2026-10-14T00:00:00.000Z" },
    })

    expect(screen.getByText("Martes 13 de octubre")).toHaveClass("bg-interaction")
    const card = screen.getByText("Editar bloque").closest('[data-slot="card"]')
    expect(card).toHaveClass("ring-1", "ring-border-strong")
    expect(screen.queryByText("Los días anteriores a hoy no se pueden elegir.")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "martes, 13 de octubre de 2026" }),
    ).not.toBeInTheDocument()

    const submit = screen.getByRole("button", { name: "Guardar cambios" })
    expect(submit).toHaveClass("bg-primary", "text-primary-foreground")
  })

  it("deshabilita el envío mientras se guarda y muestra el error del servidor", () => {
    renderForm({ isSubmitting: true, submitError: "Error al crear el bloque de disponibilidad" })

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled()
    expect(screen.getByText("Error al crear el bloque de disponibilidad")).toBeInTheDocument()
  })

  it("no muestra la casilla de repetición en modo edición", () => {
    renderForm({
      mode: "edit",
      initialValues: { startAt: "2026-10-13T22:00:00.000Z", endAt: "2026-10-14T00:00:00.000Z" },
    })

    expect(screen.queryByText("Repetir cada semana")).not.toBeInTheDocument()
  })

  it("la casilla de repetir cada semana empieza destildada y sin el campo de fecha límite", () => {
    renderForm()

    expect(screen.getByRole("checkbox", { name: /Repetir cada semana/ })).not.toBeChecked()
    expect(screen.queryByRole("group", { name: "Repetir hasta" })).not.toBeInTheDocument()
  })

  it("marcar la casilla muestra el calendario de Repetir hasta", async () => {
    const { user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))

    expect(screen.getByRole("group", { name: "Repetir hasta" })).toBeInTheDocument()
  })

  it("exige elegir la fecha límite si la repetición está activa", async () => {
    const { onSubmit, user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
    await user.click(screen.getByRole("button", { name: "Guardar bloque" }))

    expect(screen.getByText("Elige hasta qué fecha se repite el bloque")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("envía repeatWeekly y repeatUntil cuando se marca la casilla y se elige la fecha límite", async () => {
    const { onSubmit, user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
    const repeatGroup = screen.getByRole("group", { name: "Repetir hasta" })
    await user.click(within(repeatGroup).getByRole("button", { name: "martes, 20 de octubre de 2026" }))
    await user.click(screen.getByRole("button", { name: "Guardar bloque" }))

    expect(onSubmit).toHaveBeenCalledWith({
      startAt: "2026-10-13T22:00:00.000Z",
      endAt: "2026-10-14T00:00:00.000Z",
      repeatWeekly: true,
      repeatUntil: "2026-10-20",
    })
  })

  it("desmarcar la casilla oculta y limpia la fecha límite elegida", async () => {
    const { user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
    const repeatGroup = screen.getByRole("group", { name: "Repetir hasta" })
    await user.click(within(repeatGroup).getByRole("button", { name: "martes, 20 de octubre de 2026" }))
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))

    expect(screen.queryByRole("group", { name: "Repetir hasta" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
    expect(
      within(screen.getByRole("group", { name: "Repetir hasta" })).getByRole("button", {
        name: "martes, 20 de octubre de 2026",
      }),
    ).not.toHaveAttribute("aria-pressed", "true")
  })

  it("limpia la fecha límite elegida si la nueva fecha del bloque ya no la admite", async () => {
    const { user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
    await user.click(
      within(screen.getByRole("group", { name: "Repetir hasta" })).getByRole("button", {
        name: "martes, 20 de octubre de 2026",
      }),
    )

    const [mainCalendarDay] = screen.getAllByRole("button", { name: "miércoles, 21 de octubre de 2026" })
    await user.click(mainCalendarDay)

    expect(
      within(screen.getByRole("group", { name: "Repetir hasta" })).queryByRole("button", {
        name: "martes, 20 de octubre de 2026",
        pressed: true,
      }),
    ).not.toBeInTheDocument()
  })

  it("el calendario de Repetir hasta deshabilita los días anteriores al bloque", async () => {
    const { user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
    const repeatGroup = screen.getByRole("group", { name: "Repetir hasta" })

    expect(within(repeatGroup).getByRole("button", { name: "lunes, 12 de octubre de 2026" })).toBeDisabled()
  })

  it("el calendario de Repetir hasta solo habilita desde los 7 días del bloque (al menos una repetición real)", async () => {
    const { user } = renderForm()

    await fillForm(user, "martes, 13 de octubre de 2026", "18:00", "20:00")
    await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
    const repeatGroup = screen.getByRole("group", { name: "Repetir hasta" })

    expect(within(repeatGroup).getByRole("button", { name: "martes, 13 de octubre de 2026" })).toBeDisabled()
    expect(within(repeatGroup).getByRole("button", { name: "jueves, 15 de octubre de 2026" })).toBeDisabled()
    expect(within(repeatGroup).getByRole("button", { name: "lunes, 19 de octubre de 2026" })).toBeDisabled()
    expect(within(repeatGroup).getByRole("button", { name: "martes, 20 de octubre de 2026" })).toBeEnabled()
  })
})
