import { screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { toast } from "sonner"
import { renderWithQuery } from "@/shared/testing/render-with-query"
import { MentorAvailabilityView } from "./mentor-availability-view"
import { availabilityApi } from "../services/availability.service"
import type { AvailabilityBlock } from "../types/availability-block.types"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

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
    vi.spyOn(availabilityApi, "getBlockedDates").mockResolvedValue([])
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
    vi.useFakeTimers({ toFake: ["Date"], now: NOW })
    vi.spyOn(availabilityApi, "getMyAvailabilityStatus").mockResolvedValue({ mentorId: "m1", isAvailable: true })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("muestra el skeleton mientras carga", () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockImplementation(
      () => new Promise(() => {}),
    )

    renderWithQuery(<MentorAvailabilityView />)

    expect(screen.getByText("Cargando disponibilidad...")).toBeInTheDocument()
  })

  it("muestra el interruptor «Recibir solicitudes de mentoría» con el estado actual", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    renderWithQuery(<MentorAvailabilityView />)

    const toggle = screen.getByRole("switch", { name: "Recibir solicitudes de mentoría" })
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"))
  })

  it("muestra la sección y la zona horaria de Bolivia", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    renderWithQuery(<MentorAvailabilityView />)

    expect(
      screen.getByText("Mentorías. Selecciona el encabezado de un día para bloquear o desbloquear la fecha."),
    ).toBeInTheDocument()
    expect(screen.getByText("Hora de Bolivia (GMT-4)")).toBeInTheDocument()
    await waitFor(() => expect(availabilityApi.getAvailabilityBlocks).toHaveBeenCalled())
  })

  it("empieza en la semana actual de Bolivia", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    renderWithQuery(<MentorAvailabilityView />)

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
    renderWithQuery(<MentorAvailabilityView />)

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
    renderWithQuery(<MentorAvailabilityView />)

    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }))
    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }))
    const todayButton = screen.getByRole("button", { name: "Hoy" })
    expect(todayButton).toBeEnabled()

    fireEvent.click(todayButton)

    expect(screen.getByText("5 – 11 de octubre de 2026")).toBeInTheDocument()
    expect(todayButton).toBeDisabled()
    expect(await screen.findByText("Aún no registraste bloques esta semana")).toBeInTheDocument()
  })

  it("solo muestra los bloques de la semana visible", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("in-week", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
      blockAt("next-week", "2026-10-13T14:00:00.000Z", "2026-10-13T15:00:00.000Z"),
    ])

    renderWithQuery(<MentorAvailabilityView />)

    const grid = await screen.findByRole("region", { name: "Disponibilidad semanal" })
    expect(within(grid).getAllByRole("button", { name: /^libre,/ })).toHaveLength(1)
    expect(within(grid).getByRole("button", { name: "libre, 10:00 a 11:00" })).toBeInTheDocument()
  })

  it("muestra la grilla con sus fechas y el aviso cuando la semana no tiene bloques", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    renderWithQuery(<MentorAvailabilityView />)

    expect(await screen.findByText("Aún no registraste bloques esta semana")).toBeInTheDocument()
    const grid = screen.getByRole("region", { name: "Disponibilidad semanal" })
    expect(within(grid).getByRole("heading", { name: "LUN 5" })).toBeInTheDocument()
    expect(within(grid).getByRole("heading", { name: "DOM 11" })).toBeInTheDocument()
    expect(within(grid).getAllByText("Sin bloques")).toHaveLength(7)
  })

  it("al pasar a una semana sin bloques sigue mostrando la grilla con las fechas de esa semana", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockImplementation(async (filters) =>
      filters?.from === "2026-10-05T04:00:00.000Z"
        ? [blockAt("in-week", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z")]
        : [],
    )
    renderWithQuery(<MentorAvailabilityView />)
    await screen.findByRole("button", { name: "libre, 10:00 a 11:00" })

    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }))

    expect(await screen.findByText("Aún no registraste bloques esta semana")).toBeInTheDocument()
    const grid = screen.getByRole("region", { name: "Disponibilidad semanal" })
    expect(within(grid).getByRole("heading", { name: "LUN 12" })).toBeInTheDocument()
    expect(within(grid).getByRole("heading", { name: "DOM 18" })).toBeInTheDocument()
    expect(within(grid).queryAllByRole("button", { name: /^libre,/ })).toHaveLength(0)
  })

  it("muestra el error si falla la consulta", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockRejectedValue(new Error("Network error"))

    renderWithQuery(<MentorAvailabilityView />)

    expect(
      await screen.findByText("Error al obtener los bloques de disponibilidad"),
    ).toBeInTheDocument()
  })

  it("abre el panel de edición con la grilla al hacer clic en un bloque libre", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
    ])
    const user = userEvent.setup()

    renderWithQuery(<MentorAvailabilityView />)

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
      { ...blockAt("c", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"), state: "confirmed" },
    ])
    const user = userEvent.setup()

    renderWithQuery(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "confirmada, 10:00 a 11:00" }))

    expect(await screen.findByText("Editar bloque")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Eliminar bloque" })).toBeDisabled()
    expect(
      screen.getByText("Solo se puede editar si el bloque no tiene ninguna cita asociada."),
    ).toBeInTheDocument()
  })

  it("al tocar un bloque con cita muestra quién reservó y el tema (HU-06 CA5)", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      {
        ...blockAt("c", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
        state: "confirmed",
        appointment: {
          id: "a1",
          counterpart: { id: "s1", fullName: "Titulado Uno", role: "student" },
          orientationType: { id: "o1", name: "Orientación profesional" },
        },
      },
    ])
    const user = userEvent.setup()

    renderWithQuery(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "confirmada, 10:00 a 11:00" }))

    const detail = await screen.findByLabelText("Cita confirmada")
    expect(within(detail).getByText("Titulado Uno")).toBeInTheDocument()
    expect(within(detail).getByText("Orientación profesional")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Eliminar bloque" })).toBeDisabled()
  })

  it("arranca en la semana de la URL si viene indicada", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    renderWithQuery(<MentorAvailabilityView initialWeekStart="2026-10-12T04:00:00.000Z" />)

    expect(screen.getByText("12 – 18 de octubre de 2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hoy" })).toBeEnabled()
    await waitFor(() => expect(lastRequestedRange()?.from).toBe("2026-10-12T04:00:00.000Z"))
  })

  it("el panel de edición reemplaza al de agregar y cancelar lo vuelve a mostrar", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
    ])
    const user = userEvent.setup()

    renderWithQuery(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "libre, 10:00 a 11:00" }))
    expect(screen.getByText("Editar bloque")).toBeInTheDocument()
    expect(screen.getByText("Nuevo bloque de disponibilidad")).not.toBeVisible()

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByText("Editar bloque")).not.toBeInTheDocument()
    expect(screen.getByText("Nuevo bloque de disponibilidad")).toBeVisible()
  })

  it("deja fijo el panel lateral al bajar desde 1200 px, con su propio scroll (#1456)", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    renderWithQuery(<MentorAvailabilityView />)

    const panel = (await screen.findByText("Nuevo bloque de disponibilidad")).closest(".min-w-0.min-\\[1200px\\]\\:sticky")
    expect(panel).not.toBeNull()
    expect(panel).toHaveClass("min-[1200px]:overflow-y-auto")
    expect(panel?.parentElement).toHaveClass("min-[1200px]:items-start")
  })

  it("conserva lo que se llenó en Nuevo bloque al abrir otro panel y volver", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
    ])
    const user = userEvent.setup()

    renderWithQuery(<MentorAvailabilityView />)

    const block = await screen.findByRole("button", { name: "libre, 10:00 a 11:00" })
    await user.click(screen.getByRole("button", { name: "viernes, 9 de octubre de 2026" }))
    await user.click(screen.getByLabelText(/Hora de inicio/))
    await user.click(await screen.findByRole("option", { name: "15:00" }))

    await user.click(block)
    expect(screen.getByText("Editar bloque")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.getByLabelText(/Fecha/)).toHaveValue("Viernes 9 de octubre de 2026")
    expect(screen.getByLabelText(/Hora de inicio/)).toHaveTextContent("15:00")
  })

  it("cambiar de semana cierra el panel de edición", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z", "2026-10-06T15:00:00.000Z"),
    ])
    const user = userEvent.setup()

    renderWithQuery(<MentorAvailabilityView />)

    await user.click(await screen.findByRole("button", { name: "libre, 10:00 a 11:00" }))
    expect(screen.getByText("Editar bloque")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Semana siguiente" }))

    expect(screen.queryByText("Editar bloque")).not.toBeInTheDocument()
  })

  describe("panel Agregar bloque", () => {
    async function fillAndSave(user: ReturnType<typeof userEvent.setup>) {
      await screen.findByText("Aún no registraste bloques esta semana")
      await user.click(screen.getByRole("button", { name: "jueves, 8 de octubre de 2026" }))
      await user.click(screen.getByLabelText(/Hora de inicio/))
      await user.click(await screen.findByRole("option", { name: "18:00" }))
      await user.click(screen.getByLabelText(/Hora de fin/))
      await user.click(await screen.findByRole("option", { name: "18:30" }))
      await user.click(screen.getByRole("button", { name: "Guardar bloque" }))
    }

    it("muestra siempre el formulario, a la derecha de la grilla", async () => {
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

      renderWithQuery(<MentorAvailabilityView />)

      expect(screen.getByText("Nuevo bloque de disponibilidad")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Guardar bloque" })).toBeInTheDocument()
    })

    it("al guardar, avisa con un toast, refresca la grilla sin recargar y limpia el formulario", async () => {
      const savedBlock = blockAt("nuevo-1", "2026-10-08T22:00:00.000Z", "2026-10-08T22:30:00.000Z")
      const getSpy = vi
        .spyOn(availabilityApi, "getAvailabilityBlocks")
        .mockResolvedValueOnce([])
        .mockResolvedValue([savedBlock])
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue(savedBlock)
      const user = userEvent.setup()

      renderWithQuery(<MentorAvailabilityView />)
      await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(1))

      await fillAndSave(user)

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Bloque guardado correctamente."),
      )
      expect(screen.getByLabelText(/Hora de inicio/)).toHaveValue("")
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "libre, 18:00 a 18:30" })).toBeInTheDocument(),
      )
    })

    it("si el bloque nuevo es de otra semana, la grilla pasa a esa semana", async () => {
      const nextWeekBlock = blockAt("nuevo-2", "2026-10-14T22:00:00.000Z", "2026-10-14T22:30:00.000Z")
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockImplementation(async (filters) =>
        filters?.from === "2026-10-12T04:00:00.000Z" ? [nextWeekBlock] : [],
      )
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue(nextWeekBlock)
      const user = userEvent.setup()

      renderWithQuery(<MentorAvailabilityView />)
      await screen.findByText("Aún no registraste bloques esta semana")
      await user.click(screen.getByRole("button", { name: "miércoles, 14 de octubre de 2026" }))
      await user.click(screen.getByLabelText(/Hora de inicio/))
      await user.click(await screen.findByRole("option", { name: "18:00" }))
      await user.click(screen.getByLabelText(/Hora de fin/))
      await user.click(await screen.findByRole("option", { name: "18:30" }))
      await user.click(screen.getByRole("button", { name: "Guardar bloque" }))

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

      renderWithQuery(<MentorAvailabilityView />)
      await fillAndSave(user)

      expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled()

      resolveCreate(blockAt("nuevo-1", "2026-10-08T22:00:00.000Z", "2026-10-08T22:30:00.000Z"))
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Guardar bloque" })).toBeEnabled(),
      )
    })

    it.each(["Ya tienes un bloque en ese horario", "Ese día está bloqueado"])("muestra el detail del backend al crear un bloque: %s", async (detail) => {
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockRejectedValue({
        response: { data: { statusCode: 409, detail, ok: false } },
      })
      const user = userEvent.setup()

      renderWithQuery(<MentorAvailabilityView />)
      await fillAndSave(user)

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(detail),
      )
    })

    async function fillAndSaveWithRepeat(user: ReturnType<typeof userEvent.setup>) {
      await screen.findByText("Aún no registraste bloques esta semana")
      await user.click(screen.getByRole("button", { name: "jueves, 8 de octubre de 2026" }))
      await user.click(screen.getByLabelText(/Hora de inicio/))
      await user.click(await screen.findByRole("option", { name: "18:00" }))
      await user.click(screen.getByLabelText(/Hora de fin/))
      await user.click(await screen.findByRole("option", { name: "18:30" }))
      await user.click(screen.getByRole("checkbox", { name: /Repetir cada semana/ }))
      const repeatGroup = screen.getByRole("group", { name: "Repetir hasta" })
      await user.click(within(repeatGroup).getByRole("button", { name: "jueves, 15 de octubre de 2026" }))
      await user.click(screen.getByRole("button", { name: "Guardar bloque" }))
    }

    it("si la serie no creó ningún bloque, no limpia el formulario ni cambia de semana", async () => {
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue({
        created: 0,
        skipped: ["2026-10-08", "2026-10-15"],
      })
      const user = userEvent.setup()

      renderWithQuery(<MentorAvailabilityView />)
      await fillAndSaveWithRepeat(user)

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("No se creó ningún bloque.", expect.any(Object)),
      )
      expect(screen.getByLabelText(/Hora de inicio/)).toHaveTextContent("18:00")
    })

    it("con una serie semanal, la grilla pasa a la semana del bloque aunque la respuesta no tenga startAt", async () => {
      vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
      vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue({ created: 2, skipped: [] })
      const user = userEvent.setup()

      renderWithQuery(<MentorAvailabilityView />)
      await fillAndSaveWithRepeat(user)

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Se crearon 2 bloques.", expect.any(Object)),
      )
      expect(screen.getByLabelText(/Hora de inicio/)).toHaveTextContent("--:--")
    })
  })
})
