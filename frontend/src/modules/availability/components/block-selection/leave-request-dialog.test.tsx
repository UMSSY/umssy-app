import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LeaveRequestDialog } from "./leave-request-dialog"
import { LEAVE_REQUEST_TEXT } from "../../constants/request-appointment.constants"

describe("LeaveRequestDialog", () => {
  afterEach(() => {
    cleanup()
  })

  it("advierte que la solicitud no se envió y que se perderán los datos", () => {
    render(<LeaveRequestDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText(LEAVE_REQUEST_TEXT.title)).toBeInTheDocument()
    expect(screen.getByText(LEAVE_REQUEST_TEXT.description)).toBeInTheDocument()
  })

  it("confirma o cancela la salida", async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<LeaveRequestDialog open onConfirm={onConfirm} onCancel={onCancel} />)

    await user.click(screen.getByRole("button", { name: LEAVE_REQUEST_TEXT.stay }))
    expect(onCancel).toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: LEAVE_REQUEST_TEXT.leave }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it("no se muestra cerrado", () => {
    render(<LeaveRequestDialog open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.queryByText(LEAVE_REQUEST_TEXT.title)).not.toBeInTheDocument()
  })
})
