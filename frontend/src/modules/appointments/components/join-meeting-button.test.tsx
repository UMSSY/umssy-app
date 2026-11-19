import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { JOIN_MEETING_TEXT } from "../constants/appointments.constants"
import { JoinMeetingButton } from "./join-meeting-button"

const MEETING_URL = "https://meet.jit.si/umssy-3f9c1a2e-5b7d-4c1e-9a2b-1c2d3e4f5a6b"

describe("JoinMeetingButton", () => {
  afterEach(() => {
    cleanup()
  })

  it("con enlace abre la sala en una pestaña nueva y deja «Mis citas» en la pestaña original", async () => {
    const user = userEvent.setup()
    const originalUrl = window.location.href
    render(<JoinMeetingButton meetingUrl={MEETING_URL} />)

    const join = screen.getByRole("link", { name: JOIN_MEETING_TEXT.join })
    expect(join).toHaveAttribute("href", MEETING_URL)
    expect(join).toHaveAttribute("target", "_blank")
    expect(join).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.queryByRole("button", { name: JOIN_MEETING_TEXT.join })).not.toBeInTheDocument()

    await user.click(join)

    expect(window.location.href).toBe(originalUrl)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("sin enlace no muestra el aviso hasta que se intenta unirse", async () => {
    const user = userEvent.setup()
    render(<JoinMeetingButton meetingUrl={null} />)

    expect(screen.queryByRole("link", { name: JOIN_MEETING_TEXT.join })).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: JOIN_MEETING_TEXT.join }))

    expect(screen.getByRole("alert")).toHaveTextContent(JOIN_MEETING_TEXT.unavailable)
  })

  it("sin enlace muestra un solo aviso aunque se intente unirse varias veces", async () => {
    const user = userEvent.setup()
    render(<JoinMeetingButton meetingUrl={null} />)

    const join = screen.getByRole("button", { name: JOIN_MEETING_TEXT.join })
    await user.click(join)
    await user.click(join)

    expect(screen.getAllByRole("alert")).toHaveLength(1)
    expect(join).toBeEnabled()
  })
})
