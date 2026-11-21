
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MentorRequestHistoryEmptyState } from "./mentor-request-history-empty-state";

describe("mentor request history empty state HU14", () => {
  it("muestra un mensaje cuando no existen solicitudes registradas", () => {
    const html = renderToStaticMarkup(
      <MentorRequestHistoryEmptyState />,
    );

    expect(html).toContain("Aún no tienes solicitudes registradas");
    expect(html).toContain(
      "Cuando realices una solicitud de cupo como mentor",
    );
  });

  it("presenta el estado vacío con atributos accesibles", () => {
    const html = renderToStaticMarkup(
      <MentorRequestHistoryEmptyState />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain(
      'aria-labelledby="mentor-request-history-empty-title"',
    );
    expect(html).toContain(
      'id="mentor-request-history-empty-title"',
    );
    expect(html).toContain('aria-hidden="true"');
  });
});
