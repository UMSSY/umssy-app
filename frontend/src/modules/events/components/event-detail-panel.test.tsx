import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventDetailPanel } from "./event-detail-panel";
import type { EventDetail } from "../types/event-detail.types";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const event: EventDetail = {
  id: "event-1",
  title: "React",
  category: { id: "cat-1", name: "Tecnología" },
  description: "Aprende React",
  instructorName: "Ana",
  eventDate: "2026-10-20",
  startTime: "09:00",
  endTime: "12:00",
  location: "Aula 101",
  capacity: 30,
  availableSpots: 20,
  registrationCount: 10,
  statusId: "published",
  modalityId: "m1",
  modality: { id: "m1", title: "Presencial" },
};
describe("EventDetailPanel", () => {
  it('omits the redundant institution from a complete venue', () => {
    render(<EventDetailPanel event={{ ...event, location: 'Laboratorio 1, Facultad de Ciencias y Tecnología, UMSS' }} />);
    expect(screen.getByText('Laboratorio 1, Facultad de Ciencias y Tecnología')).toBeInTheDocument();
    expect(screen.queryByText(/, UMSS$/)).not.toBeInTheDocument();
  });

  it.each([
    { availableSpots: null },
    { availableSpots: undefined },
    { capacity: undefined },
    { capacity: -1 },
    { capacity: Infinity },
    { availableSpots: -1 },
    { availableSpots: NaN },
    { availableSpots: 0.5 },
    { registrationCount: undefined },
    { registrationCount: -1 },
    { registrationCount: 30, availableSpots: 5 },
    { capacity: null, availableSpots: 20 },
  ])('blocks registration with invalid capacity: %j', (invalidData) => {
    render(<EventDetailPanel event={{ ...event, ...invalidData } as EventDetail} />);
    expect(screen.getByRole('button', { name: 'Inscripción no disponible' })).toBeDisabled();
    expect(screen.getByText('Información de cupos no disponible.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('updates availability when the displayed workshop changes', () => {
    const { rerender } = render(<EventDetailPanel event={event} />);
    expect(screen.getByRole('button', { name: 'Inscribirme' })).toBeEnabled();
    rerender(<EventDetailPanel event={{ ...event, id: 'full', availableSpots: 0, registrationCount: 30 }} />);
    expect(screen.getByRole('button', { name: 'Taller lleno' })).toBeDisabled();
    rerender(<EventDetailPanel event={{ ...event, id: 'unknown', availableSpots: null }} />);
    expect(screen.getByRole('button', { name: 'Inscripción no disponible' })).toBeDisabled();
    rerender(<EventDetailPanel event={event} />);
    expect(screen.getByRole('button', { name: 'Inscribirme' })).toBeEnabled();
  });

  it('keeps the registration button outside form submission', () => {
    const submit = vi.fn();
    render(<form onSubmit={submit}><EventDetailPanel event={event} /></form>);
    expect(screen.getByRole('button', { name: 'Inscribirme' })).toHaveAttribute('type', 'button');
    expect(submit).not.toHaveBeenCalled();
  });
  it("shows detail and available registration", () => {
    render(<EventDetailPanel event={event} />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Aula 101")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 12:00 hrs")).toBeInTheDocument();
    expect(screen.getByText("Aprende React")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Inscribirme" });
    expect(button).toBeEnabled();
    expect(screen.getByText("20 cupos disponibles")).toBeInTheDocument();
  });
  it("places the registration action before the descriptive content", () => {
    render(<EventDetailPanel event={event} />);
    const action = screen.getByRole("button", { name: "Inscribirme" });
    const description = screen.getByText("Aprende React");
    expect(action.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("disables registration for full workshops", () => {
    render(
      <EventDetailPanel
        event={{ ...event, availableSpots: 0, registrationCount: 30 }}
      />,
    );
    expect(screen.getByRole("button", { name: "Taller lleno" })).toBeDisabled();
    expect(
      screen.getByText("Lleno · Sin cupos disponibles"),
    ).toBeInTheDocument();
  });
  it("handles missing optional values and unlimited capacity", () => {
    render(
      <EventDetailPanel
        event={{
          ...event,
          location: null,
          instructorName: null,
          description: null,
          capacity: null,
          availableSpots: null,
        }}
      />,
    );
    expect(screen.getAllByText("Por confirmar")).toHaveLength(2);
    expect(screen.getByText("Descripción por confirmar.")).toBeInTheDocument();
    expect(screen.getByText("Sin límite de cupos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inscribirme" })).toBeEnabled();
  });
  it("labels virtual locations as an access link", () => {
    render(
      <EventDetailPanel
        event={{
          ...event,
          modality: { id: "virtual", title: "Virtual" },
          location: "https://example.com/meeting",
        }}
      />,
    );
    expect(screen.getByText("Enlace:")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/meeting")).toBeInTheDocument();
  });
});
