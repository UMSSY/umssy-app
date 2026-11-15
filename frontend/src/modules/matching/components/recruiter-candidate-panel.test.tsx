import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { radarRecruiterApi } from "../services/radar-recruiter.service";
import { RADAR_AXES } from "../constants/radar-axes.constants";
import type { AreaEvidence } from "../types/area-evidence.types";
import type { RecruiterApplicant } from "../types/recruiter-applicant.types";
import type { RecruiterTarget } from "../types/recruiter-target.types";
import { RecruiterCandidatePanel } from "./recruiter-candidate-panel";

vi.mock("@/modules/matching/components/radar-chart", () => ({
  RadarChart: ({
    axes,
    series,
    onAxisSelect,
  }: {
    axes: { id: string; label: string }[];
    series: { id: string; name: string; values: Record<string, number> }[];
    onAxisSelect?: (axisId: string) => void;
  }) => (
    <div data-testid="matching-radar-chart">
      {series.map((item) => (
        <span key={item.id}>{item.name}</span>
      ))}
      {onAxisSelect &&
        axes.map((axis) => (
          <button
            key={axis.id}
            type="button"
            onClick={() => onAxisSelect(axis.id)}
          >
            Seleccionar {axis.label}
          </button>
        ))}
    </div>
  ),
}));

const TARGET: RecruiterTarget = {
  id: "vac-1",
  title: "Tech Lead",
  target: {
    desarrollo: 7,
    "cloud-devops": 6,
    "data-ai": 6,
    qa: 5,
    ciberseguridad: 5,
    "gobernanza-ti": 6,
  },
};

const CARLOS: RecruiterApplicant = {
  applicationId: "app-carlos",
  userId: "user-carlos",
  name: "Carlos Mendoza Ríos",
  headline: "Senior Software Engineer",
  email: "carlos@example.com",
  phone: "+591 7000 0001",
  appliedAt: "2026-10-01T10:00:00.000Z",
  state: "applied",
  canViewCv: true,
  version: 3,
  average: 6.5,
  scores: {
    desarrollo: 8.5,
    "cloud-devops": 7,
    "data-ai": 6.5,
    qa: 5,
    ciberseguridad: 4.5,
    "gobernanza-ti": 6,
  },
  evidence: {},
  comparison: {
    match: 82,
    gaps: {
      desarrollo: 1.5,
      "cloud-devops": 1,
      "data-ai": 0.5,
      qa: 0,
      ciberseguridad: -0.5,
      "gobernanza-ti": 0,
    },
  },
  skills: ["React"],
};

const EVIDENCE: AreaEvidence = {
  education: [
    {
      id: "edu-1",
      degree: "Maestría en Ciencias de la Computación",
      institution: "UMSS",
      year: 2020,
    },
  ],
  certifications: [],
  experiences: [],
  tags: ["Python"],
};

function renderPanel(candidate: RecruiterApplicant | null) {
  return renderWithQuery(
    <RecruiterCandidatePanel
      candidate={candidate}
      vacancy={TARGET}
      axes={RADAR_AXES}
    />,
  );
}

describe("RecruiterCandidatePanel", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:cv-autorizado"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(radarRecruiterApi, "areaEvidence").mockResolvedValue(EVIDENCE);
    vi.spyOn(radarRecruiterApi, "decide").mockResolvedValue({
      id: "app-carlos",
      state: "hired",
    });
    vi.spyOn(radarRecruiterApi, "recruiterCv").mockResolvedValue(
      new Blob(["pdf"], { type: "application/pdf" }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("pide seleccionar un candidato cuando no hay ninguno", () => {
    renderPanel(null);

    expect(
      screen.getByText(
        "Selecciona un candidato de la lista para ver su detalle.",
      ),
    ).toBeInTheDocument();
  });

  it("compara ambos radares y muestra las brechas y el contacto autorizado", () => {
    renderPanel(CARLOS);

    expect(
      screen.getByText(/Compatibilidad vs\. Tech Lead/i),
    ).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByTestId("matching-radar-chart")).toBeInTheDocument();
    expect(screen.getByText("Brecha por área")).toBeInTheDocument();
    expect(screen.getByText("carlos@example.com")).toBeInTheDocument();
    expect(screen.getByText("+591 7000 0001")).toBeInTheDocument();
    const contact = screen.getByText("Datos de contacto autorizados");
    const reviewCv = screen.getByRole("button", { name: "Revisar CV" });
    expect(
      contact.compareDocumentPosition(reviewCv) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Revisar CV" }),
    ).toBeInTheDocument();
  });

  it("no muestra contacto ni CV cuando el titular no los autorizó", () => {
    renderPanel({ ...CARLOS, email: null, phone: null, canViewCv: false });

    expect(
      screen.getByText(
        "El candidato no autorizó compartir sus datos de contacto.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("El candidato no autorizó compartir su CV."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Revisar CV" }),
    ).not.toBeInTheDocument();
  });

  it("carga la evidencia autorizada al elegir un eje y la cierra", async () => {
    renderPanel(CARLOS);

    fireEvent.click(
      screen.getByRole("button", { name: "Seleccionar Data/AI" }),
    );

    expect(
      await screen.findByText("Maestría en Ciencias de la Computación"),
    ).toBeInTheDocument();
    expect(radarRecruiterApi.areaEvidence).toHaveBeenCalledWith(
      "app-carlos",
      "data-ai",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar detalle del área" }),
    );

    expect(
      screen.queryByRole("region", {
        name: "Evidencias de Carlos Mendoza Ríos",
      }),
    ).not.toBeInTheDocument();
  });

  it("muestra un error de evidencias y permite reintentar", async () => {
    vi.mocked(radarRecruiterApi.areaEvidence).mockRejectedValueOnce(
      new Error("fallo de red"),
    );
    renderPanel(CARLOS);

    fireEvent.click(
      screen.getByRole("button", { name: "Seleccionar Data/AI" }),
    );

    expect(
      await screen.findByText(
        "No se pudieron cargar las evidencias autorizadas.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar evidencias" }),
    );

    expect(
      await screen.findByText("Maestría en Ciencias de la Computación"),
    ).toBeInTheDocument();
  });

  it("abre el CV autorizado como blob", async () => {
    renderPanel(CARLOS);

    fireEvent.click(screen.getByRole("button", { name: "Revisar CV" }));

    await waitFor(() => {
      expect(radarRecruiterApi.recruiterCv).toHaveBeenCalledWith("app-carlos");
      expect(window.open).toHaveBeenCalledWith(
        "blob:cv-autorizado",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  it("informa cuando el CV autorizado no se puede abrir", async () => {
    vi.mocked(radarRecruiterApi.recruiterCv).mockRejectedValueOnce(
      new Error("sin CV"),
    );
    renderPanel(CARLOS);

    fireEvent.click(screen.getByRole("button", { name: "Revisar CV" }));

    expect(
      await screen.findByText(
        "No se pudo abrir el CV autorizado. Intenta nuevamente.",
      ),
    ).toBeInTheDocument();
  });

  it("registra la decisión de aceptar la postulación", async () => {
    renderPanel(CARLOS);

    fireEvent.click(
      screen.getByRole("button", { name: "Aceptar postulación" }),
    );

    await waitFor(() => {
      expect(radarRecruiterApi.decide).toHaveBeenCalledWith(
        "app-carlos",
        "hired",
      );
    });
  });

  it("registra la decisión de rechazar la postulación", async () => {
    renderPanel(CARLOS);

    fireEvent.click(
      screen.getByRole("button", { name: "Rechazar postulación" }),
    );

    await waitFor(() => {
      expect(radarRecruiterApi.decide).toHaveBeenCalledWith(
        "app-carlos",
        "rejected",
      );
    });
  });

  it("informa cuando la decisión no se puede registrar", async () => {
    vi.mocked(radarRecruiterApi.decide).mockRejectedValueOnce(
      new Error("conflicto"),
    );
    renderPanel(CARLOS);

    fireEvent.click(
      screen.getByRole("button", { name: "Aceptar postulación" }),
    );

    expect(
      await screen.findByText(
        "No se pudo registrar la decisión. Intenta nuevamente.",
      ),
    ).toBeInTheDocument();
  });

  it("oculta las acciones cuando la postulación ya tiene una decisión", () => {
    renderPanel({ ...CARLOS, state: "hired" });

    expect(screen.getByText("Contratado.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aceptar postulación" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rechazar postulación" }),
    ).not.toBeInTheDocument();
  });
});
