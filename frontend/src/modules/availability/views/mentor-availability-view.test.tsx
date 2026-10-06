import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { MentorAvailabilityView } from "./mentor-availability-view"
import { availabilityApi } from "../services/availability.api"
import type { AvailabilityBlock } from "../types/availability-block.types"

const NOW = new Date("2026-10-07T15:00:00.000Z")

const blockAt = (id: string, startAt: string, endAt: string): AvailabilityBlock => ({
  id,
  mentorId: "m1",
  startAt,
  endAt,
  state: "free",
  createdAt: "",
  updatedAt: "",
})

const lastRequestedRange = () => vi.mocked(availabilityApi.getAvailabilityBlocks).mock.lastCall?.[0]

describe("MentorAvailabilityView", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers({ toFake: ["Date"], now: NOW })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("muestra el skeleton mientras carga", () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockImplementation(
      () => new Promise(() => {}),
    )

    render(<MentorAvailabilityView />)

    expect(screen.getByText("Cargando disponibilidad...")).toBeInTheDocument()
  })

  it("muestra la sección y la zona horaria de Bolivia", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    render(<MentorAvailabilityView />)

    expect(screen.getByText("Mentorías")).toBeInTheDocument()
    expect(screen.getByText("Hora de Bolivia (GMT-4)")).toBeInTheDocument()
    await waitFor(() => expect(availabilityApi.getAvailabilityBlocks).toHaveBeenCalled())
  })

  it("empieza en la semana actual de Bolivia", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    render(<MentorAvailabilityView />)

    expect(screen.getByText("5 – 11 de octubre de 2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hoy" })).toBeDisabled()
    await waitFor(() =>
      expect(lastRequestedRange()).toEqual({
        from: "2026-10-05T04:00:00.000Z",
        to: "2026-10-12T03:59:59.999Z",
      }),
    )
  })

  it("las flechas cambian de semana y piden sus bloques", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
    render(<MentorAvailabilityView />)

    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }))
    expect(screen.getByText("12 – 18 de octubre de 2026")).toBeInTheDocument()
    await waitFor(() => expect(lastRequestedRange()?.from).toBe("2026-10-12T04:00:00.000Z"))

    fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }))
    fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }))
    expect(screen.getByText("28 de septiembre – 4 de octubre de 2026")).toBeInTheDocument()
    await waitFor(() => expect(lastRequestedRange()?.from).toBe("2026-09-28T04:00:00.000Z"))
  })

  it("Hoy vuelve a la semana actual", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
    render(<MentorAvailabilityView />)

    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }))
    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }))
    const todayButton = screen.getByRole("button", { name: "Hoy" })
    expect(todayButton).toBeEnabled()

    fireEvent.click(todayButton)

    expect(screen.getByText("5 – 11 de octubre de 2026")).toBeInTheDocument()
    expect(todayButton).toBeDisabled()
    await waitFor(() => expect(lastRequestedRange()?.from).toBe("2026-10-05T04:00:00.000Z"))
  })

  it("solo muestra los bloques de la semana visible", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("in-week", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
      blockAt("next-week", "2026-10-13T14:00:00.000Z", "2026-10-13T15:00:00.000Z"),
    ])

    render(<MentorAvailabilityView />)

    const grid = await screen.findByRole("region", { name: "Disponibilidad semanal" })
    expect(within(grid).getAllByRole("button", { name: /^libre,/ })).toHaveLength(1)
    expect(within(grid).getByRole("button", { name: "libre, 10:00 a 11:00" })).toBeInTheDocument()
  })

  it("muestra el estado vacío sin bloques esta semana", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    render(<MentorAvailabilityView />)

    expect(await screen.findByText("Aún no registraste bloques esta semana")).toBeInTheDocument()
  })

  it("muestra el error si falla la consulta", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockRejectedValue(new Error("Network error"))

    render(<MentorAvailabilityView />)

    expect(
      await screen.findByText("Error al obtener los bloques de disponibilidad"),
    ).toBeInTheDocument()
  })

  it("abre el panel de edición con la grilla al hacer clic en un bloque libre", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
    ])
    const user = userEvent.setup()

    render(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "libre, 10:00 a 11:00" }))

    const grid = screen.getByRole("region", { name: "Disponibilidad semanal" })
    expect(grid).toBeInTheDocument()
    expect(within(grid).getByRole("button", { name: "libre, 10:00 a 11:00" })).toBeInTheDocument()

    expect(await screen.findByText("Editar bloque")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Eliminar bloque" })).toBeInTheDocument()
  })

  it("al tocar un bloque con cita abre el panel con las acciones deshabilitadas y el aviso", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      { ...blockAt("p", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"), state: "pending" },
    ])
    const user = userEvent.setup()

    render(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "pendiente, 10:00 a 11:00" }))

    expect(await screen.findByText("Editar bloque")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Eliminar bloque" })).toBeDisabled()
    expect(
      screen.getByText("Solo se puede editar si el bloque no tiene ninguna cita asociada."),
    ).toBeInTheDocument()
  })

  it("arranca en la semana de la URL si viene indicada", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    render(<MentorAvailabilityView initialWeekStart="2026-10-12T04:00:00.000Z" />)

    expect(screen.getByText("12 – 18 de octubre de 2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hoy" })).toBeEnabled()
    await waitFor(() => expect(lastRequestedRange()?.from).toBe("2026-10-12T04:00:00.000Z"))
  })

  it("el panel de edición reemplaza al de agregar y cancelar lo vuelve a mostrar", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
    ])
    const user = userEvent.setup()

    render(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "libre, 10:00 a 11:00" }))
    expect(screen.getByText("Editar bloque")).toBeInTheDocument()
    expect(screen.queryByText("Nuevo bloque de disponibilidad")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByText("Editar bloque")).not.toBeInTheDocument()
    expect(screen.getByText("Nuevo bloque de disponibilidad")).toBeInTheDocument()
    await waitFor(() =>
      expect(vi.mocked(availabilityApi.getAvailabilityBlocks).mock.calls.length).toBeGreaterThan(1),
    )
  })

  it("cambiar de semana cierra el panel de edición", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
    ])
    const user = userEvent.setup()

    render(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "libre, 10:00 a 11:00" }))
    expect(screen.getByText("Editar bloque")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Semana siguiente" }))

    expect(screen.queryByText("Editar bloque")).not.toBeInTheDocument()
  })

  describe("panel Agregar bloque", () => {
    async function fillAndSave(user: ReturnType<typeof userEvent.setup>) {
      // Espera a que asiente el fetch inicial de la grilla antes de interactuar
      // con el formulario, para no competir con el montaje.
      await screen.findByText("Aún no registraste bloques esta semana")
      await user.click(screen.getByRole("button", { name: "jueves, 8 de octubre de 2026" }))
      await user.selectOptions(screen.getByLabelText(/Hora de inicio/), "18:00")
      await user.selectOptions(screen.getByLabelText(/Hora de fin/), "18:30")
      await user.click(screen.getByRole("button", { name: "Guardar bloque" }))
    }

    it("muestra siempre el formulario, a la derecha de la grilla", async () => {
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

      render(<MentorAvailabilityView />)

      expect(screen.getByText("Nuevo bloque de disponibilidad")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Guardar bloque" })).toBeInTheDocument()
    })

    it("al guardar, refresca la grilla sin recargar y limpia el formulario", async () => {
      const savedBlock: AvailabilityBlock = {
        id: "nuevo-1",
        mentorId: "m1",
        startAt: "2026-10-08T22:00:00.000Z",
        endAt: "2026-10-08T22:30:00.000Z",
        state: "free",
        createdAt: "",
        updatedAt: "",
      }
      const getSpy = vi
        .spyOn(availabilityApi, "getAvailabilityBlocks")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([savedBlock])
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue(savedBlock)
      const user = userEvent.setup()

      render(<MentorAvailabilityView />)
      await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(1))

      await fillAndSave(user)

      await waitFor(() => {
        expect(screen.getByText("Bloque guardado correctamente.")).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/Hora de inicio/)).toHaveValue("")
      await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(2))
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "libre, 18:00 a 18:30" })).toBeInTheDocument(),
      )
    })

    it("si el bloque nuevo es de otra semana, la grilla pasa a esa semana", async () => {
      const nextWeekBlock = blockAt("nuevo-2", "2026-10-15T22:00:00.000Z", "2026-10-15T22:30:00.000Z")
      vi.spyOn(availabilityApi, "getAvailabilityBlocks")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([nextWeekBlock])
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue(nextWeekBlock)
      const user = userEvent.setup()

      render(<MentorAvailabilityView />)
      await fillAndSave(user)

      await waitFor(() =>
        expect(lastRequestedRange()).toEqual({
          from: "2026-10-12T04:00:00.000Z",
          to: "2026-10-19T03:59:59.999Z",
        }),
      )
      expect(await screen.findByRole("button", { name: "libre, 18:00 a 18:30" })).toBeInTheDocument()
    })

    it("el botón Guardar queda deshabilitado mientras se envía", async () => {
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
      let resolveCreate!: (block: AvailabilityBlock) => void
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve
          }),
      )
      const user = userEvent.setup()

      render(<MentorAvailabilityView />)
      await screen.findByText("Aún no registraste bloques esta semana")
      await user.click(screen.getByRole("button", { name: "jueves, 8 de octubre de 2026" }))
      await user.selectOptions(screen.getByLabelText(/Hora de inicio/), "18:00")
      await user.selectOptions(screen.getByLabelText(/Hora de fin/), "18:30")
      await user.click(screen.getByRole("button", { name: "Guardar bloque" }))

      expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled()

      resolveCreate({
        id: "nuevo-1",
        mentorId: "m1",
        startAt: "2026-10-08T22:00:00.000Z",
        endAt: "2026-10-08T22:30:00.000Z",
        state: "free",
        createdAt: "",
        updatedAt: "",
      })
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Guardar bloque" })).toBeEnabled(),
      )
    })

    it("muestra el detalle del backend cuando el guardado falla por un error de negocio (409)", async () => {
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockRejectedValue({
        response: { data: { statusCode: 409, detail: "Ya tienes un bloque en ese horario", ok: false } },
      })
      const user = userEvent.setup()

      render(<MentorAvailabilityView />)
      await fillAndSave(user)

      await waitFor(() => {
        expect(screen.getByText("Ya tienes un bloque en ese horario")).toBeInTheDocument()
      })
    })
  })
})
