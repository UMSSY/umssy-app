import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventDetailPanel } from "./event-detail-panel";
import type { EventDetail } from "../types/event-detail.types";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
beforeEach(() => { vi.useFakeTimers({ now: new Date("2026-10-10T12:00:00Z"), toFake: ["Date"] }); });
afterEach(() => {
  cleanup();
  vi.useRealTimers();
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

  it('shows voting details and invokes the supplied support action', () => {
    const onSupport = vi.fn();
    const proposal: EventDetail = {
      ...event,
      status: 'voting',
      supportCount: 14,
      supportThreshold: 20,
      supportsRemaining: 6,
      progressPercent: 70,
      votingDeadline: '2026-10-15T02:00:00.000Z',
      hasSupported: false,
    };

    render(<EventDetailPanel event={proposal} onSupport={onSupport} />);

    expect(screen.getByText('En votación')).toBeInTheDocument();
    expect(screen.getByText(/Fecha límite: 14.*oct.*2026/)).toBeInTheDocument();
    expect(screen.getByText('14 de 20 apoyos')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /apoyos para react/i })).toHaveAttribute('aria-valuenow', '70');
    expect(screen.queryByRole('progressbar', { name: /ocupación del taller/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Cupos')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Preinscribirme/Apoyar propuesta' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onSupport).toHaveBeenCalledExactlyOnceWith(proposal);
  });

  it('keeps support unavailable until an action is connected and while it is pending', () => {
    const proposal: EventDetail = { ...event, status: 'voting', hasSupported: false };
    const onSupport = vi.fn();
    const { rerender } = render(<EventDetailPanel event={proposal} />);

    expect(screen.getByRole('button', { name: 'Preinscribirme/Apoyar propuesta' })).toBeDisabled();
    rerender(<EventDetailPanel event={proposal} onSupport={onSupport} isSupportPending />);
    expect(screen.getByRole('button', { name: 'Registrando apoyo...' })).toBeDisabled();
    expect(onSupport).not.toHaveBeenCalled();
  });

  it('shows support eligibility, a retryable error, and publication feedback', () => {
    const proposal: EventDetail = { ...event, status: 'voting', hasSupported: false };
    const onSupport = vi.fn();
    const onRetrySupport = vi.fn();
    const { rerender } = render(
      <EventDetailPanel
        event={proposal}
        onSupport={onSupport}
        isSupportDisabled
        supportNotice="Solo los usuarios con perfil Titulado pueden apoyar propuestas."
      />,
    );
    expect(screen.getByRole('button', { name: 'Preinscribirme/Apoyar propuesta' })).toBeDisabled();
    expect(screen.getByText('Solo los usuarios con perfil Titulado pueden apoyar propuestas.')).toBeInTheDocument();

    rerender(<EventDetailPanel event={proposal} onSupport={onSupport} supportError="No pudimos registrar tu apoyo." onRetrySupport={onRetrySupport} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos registrar tu apoyo.');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar apoyo' }));
    expect(onRetrySupport).toHaveBeenCalledOnce();

    rerender(<EventDetailPanel event={{ ...proposal, status: 'Publicado', hasSupported: true }} supportSuccessMessage="Tu inscripción quedó confirmada." />);
    expect(screen.getByText('Tu inscripción quedó confirmada.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preinscribirme/Apoyar propuesta' })).not.toBeInTheDocument();
  });

  it('prevents a second support and does not offer normal registration', () => {
    const onSupport = vi.fn();
    render(<EventDetailPanel event={{ ...event, status: 'voting', hasSupported: true }} onSupport={onSupport} />);

    expect(screen.getByRole('status')).toHaveTextContent('Tu apoyo ya fue registrado');
    expect(screen.getByRole('button', { name: 'Ya apoyaste esta propuesta' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).not.toBeInTheDocument();
    expect(onSupport).not.toHaveBeenCalled();
  });

  it('shows an expired proposal with disabled support and no registration action', () => {
    render(<EventDetailPanel event={{
      ...event,
      status: 'Vencido',
      supportCount: 5,
      supportThreshold: 20,
      supportsRemaining: 15,
      progressPercent: 25,
      hasSupported: true,
    }} />);

    expect(screen.getByText('Vencido')).toBeInTheDocument();
    expect(screen.getByText('5 de 20 apoyos')).toBeInTheDocument();
    expect(screen.getByText('Fecha límite superada · vencida automáticamente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preinscribirme/Apoyar propuesta' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).not.toBeInTheDocument();
    expect(screen.queryByText('Cupos')).not.toBeInTheDocument();
  });
});
