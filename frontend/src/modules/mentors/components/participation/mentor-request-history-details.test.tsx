
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MentorParticipationHistoryItem } from "../../types/mentor-participation-history.types";
import { MentorRequestHistoryDetails } from "./mentor-request-history-details";

const request: MentorParticipationHistoryItem = {
  id: "request-hu14-001",
  userId: "user-hu14-001",
  status: "PENDING",
  queuedAt: "2026-11-10T14:30:00.000Z",
  createdAt: "2026-11-10T14:00:00.000Z",
  updatedAt: "2026-11-11T09:00:00.000Z",
  technicalAreaIds: ["area-1", "area-2"],
  orientationTypeIds: ["orientation-1"],
  statusId: "status-pending",
};

const renderDetails = (item: MentorParticipationHistoryItem = request) =>
  renderToStaticMarkup(
    <MentorRequestHistoryDetails request={item} onClose={() => {}} />,
  );

describe("mentor request history details HU14", () => {
  it("muestra el estado traducido y el identificador de la solicitud", () => {
    const html = renderDetails();

    expect(html).toContain("Detalles de la solicitud");
    expect(html).toContain("Pendiente");
    expect(html).toContain("request-hu14-001");
    expect(html).toContain("Estado de la solicitud");
  });

  it("muestra las fechas y cantidades registradas", () => {
    const html = renderDetails();

    expect(html).toContain("Fecha de creación");
    expect(html).toContain("Ingreso a la cola");
    expect(html).toContain("Última actualización");
    expect(html).toContain("Áreas técnicas");
    expect(html).toContain("Tipos de orientación");
    expect(html).toMatch(/>2<\/dd>/);
    expect(html).toMatch(/>1<\/dd>/);
  });

  it("incluye un botón accesible para cerrar los detalles", () => {
    const html = renderDetails();

    expect(html).toContain(
      'aria-label="Cerrar detalles de la solicitud"',
    );
    expect(html).toContain("Cerrar");
    expect(html).toContain(
      'aria-labelledby="mentor-request-history-details-title"',
    );
  });

  it("muestra un mensaje cuando las fechas son inválidas", () => {
    const html = renderDetails({
      ...request,
      createdAt: "fecha-invalida",
      queuedAt: "fecha-invalida",
      updatedAt: "fecha-invalida",
    });

    expect(html.match(/Fecha no disponible/g)).toHaveLength(3);
  });

  it("muestra la etiqueta original de un estado desconocido", () => {
    const html = renderDetails({
      ...request,
      status: "UNKNOWN_STATUS",
    });

    expect(html).toContain("UNKNOWN_STATUS");
  });
});
