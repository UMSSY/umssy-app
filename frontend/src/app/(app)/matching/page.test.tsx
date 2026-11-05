import { notifyManager } from "@tanstack/react-query";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { radarRecruiterApi } from "@/modules/matching/services/radar-recruiter.service";
import type {
  AreaEvidence,
  RecruiterApplicant,
  RecruiterApplicantsResponse,
  RecruiterVacancy,
} from "@/modules/matching/types/radar-recruiter.types";
import MatchingPage from "./page";

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

const VACANCIES: RecruiterVacancy[] = [
  { id: "vac-1", title: "Tech Lead", companyId: "company-1" },
  { id: "vac-2", title: "Data Scientist Sr.", companyId: "company-1" },
];

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
      qa: -0.5,
      ciberseguridad: -1,
      "gobernanza-ti": 0,
    },
  },
  skills: ["React", "Node.js", "AWS"],
};

const LUCIA: RecruiterApplicant = {
  applicationId: "app-lucia",
  userId: "user-lucia",
  name: "Lucía Flores Mamani",
  headline: "Data Scientist Sr.",
  email: null,
  phone: null,
  appliedAt: "2026-10-02T10:00:00.000Z",
  state: "interview",
  canViewCv: false,
  version: 2,
  average: 5.9,
  scores: {
    desarrollo: 6,
    "cloud-devops": 5,
    "data-ai": 9,
    qa: 6,
    ciberseguridad: 4,
    "gobernanza-ti": 5.5,
  },
  evidence: {},
  comparison: {
    match: 65,
    gaps: {
      desarrollo: -1,
      "cloud-devops": -1,
      "data-ai": 3,
      qa: 0.5,
      ciberseguridad: -1.5,
      "gobernanza-ti": -0.5,
    },
  },
  skills: ["Python", "TensorFlow", "SQL"],
};

const APPLICANTS_BY_VACANCY: Record<string, RecruiterApplicantsResponse> = {
  "vac-1": {
    vacancy: {
      id: "vac-1",
      title: "Tech Lead",
      target: {
        desarrollo: 7,
        "cloud-devops": 6,
        "data-ai": 6,
        qa: 5.5,
        ciberseguridad: 5.5,
        "gobernanza-ti": 6,
      },
    },
    applicants: [CARLOS, LUCIA],
  },
  "vac-2": {
    vacancy: {
      id: "vac-2",
      title: "Data Scientist Sr.",
      target: {
        desarrollo: 5,
        "cloud-devops": 4,
        "data-ai": 9,
        qa: 5,
        ciberseguridad: 3,
        "gobernanza-ti": 5,
      },
    },
    applicants: [
      { ...LUCIA, comparison: { match: 90, gaps: LUCIA.comparison!.gaps } },
      { ...CARLOS, comparison: { match: 40, gaps: CARLOS.comparison!.gaps } },
    ],
  },
};

const DATA_AI_EVIDENCE: AreaEvidence = {
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
  tags: ["Python", "TensorFlow"],
};

describe("MatchingPage (HU4)", () => {
  beforeAll(() => {
    notifyManager.setScheduler(queueMicrotask);
  });

  afterAll(() => {
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });

  beforeEach(() => {
    vi.spyOn(radarRecruiterApi, "vacancies").mockResolvedValue(VACANCIES);
    vi.spyOn(radarRecruiterApi, "applicants").mockImplementation(
      async (jobOfferId: string) => APPLICANTS_BY_VACANCY[jobOfferId]
    );
    vi.spyOn(radarRecruiterApi, "areaEvidence").mockResolvedValue(DATA_AI_EVIDENCE);
    vi.spyOn(radarRecruiterApi, "decide").mockResolvedValue({
      id: "app-lucia",
      state: "rejected",
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("carga vacantes, ordena postulantes y muestra el radar comparativo", async () => {
    renderWithQuery(<MatchingPage />);

    expect(
      screen.getByRole("heading", { name: "Buscar candidatos por afinidad" })
    ).toBeInTheDocument();

    await screen.findByText(/2 candidatos/i);

    expect(screen.getByRole("button", { name: "Tech Lead" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Data Scientist Sr." })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Carlos Mendoza Ríos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lucía Flores Mamani").length).toBeGreaterThan(0);
    expect(screen.getAllByText("82%").length).toBeGreaterThan(0);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByTestId("matching-radar-chart")).toBeInTheDocument();
    expect(screen.getByText(/Compatibilidad vs\. Tech Lead/i)).toBeInTheDocument();
    expect(screen.getByText("Brecha por área")).toBeInTheDocument();
  });

  it("filtra postulantes por nombre y actualiza el candidato seleccionado", async () => {
    renderWithQuery(<MatchingPage />);
    await screen.findByText(/2 candidatos/i);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar candidato" }), {
      target: { value: "Lucía" },
    });

    await waitFor(() => {
      expect(screen.getByText(/1 candidato/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText("Lucía Flores Mamani").length).toBeGreaterThan(0);
    expect(screen.queryByText("Carlos Mendoza Ríos")).not.toBeInTheDocument();
    expect(screen.getAllByText("65%").length).toBeGreaterThan(0);
  });

  it("muestra el estado vacío cuando la búsqueda no tiene coincidencias", async () => {
    renderWithQuery(<MatchingPage />);
    await screen.findByText(/2 candidatos/i);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar candidato" }), {
      target: { value: "candidato inexistente" },
    });

    expect(
      screen.getByText(
        /No se encontraron candidatos para "candidato inexistente"/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Selecciona un candidato de la lista para ver su detalle."
      )
    ).toBeInTheDocument();
  });

  it("actualiza la comparación al cambiar de vacante", async () => {
    renderWithQuery(<MatchingPage />);
    await screen.findByText(/Compatibilidad vs\. Tech Lead/i);

    fireEvent.click(screen.getByRole("button", { name: "Data Scientist Sr." }));

    await waitFor(() => {
      expect(
        screen.getByText("Candidatos · Data Scientist Sr.")
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Compatibilidad vs\. Data Scientist Sr\./i)).toBeInTheDocument();
    expect(screen.getAllByText("90%").length).toBeGreaterThan(0);
    expect(radarRecruiterApi.applicants).toHaveBeenCalledWith("vac-2");
  });

  it("abre evidencias autorizadas al seleccionar un eje del radar", async () => {
    renderWithQuery(<MatchingPage />);
    await screen.findByText(/Compatibilidad vs\. Tech Lead/i);

    fireEvent.click(
      screen.getByRole("button", { name: "Seleccionar Data/AI" })
    );

    await screen.findByText("Maestría en Ciencias de la Computación");
    expect(radarRecruiterApi.areaEvidence).toHaveBeenCalledWith(
      "app-carlos",
      "data-ai"
    );
    expect(
      screen.getByRole("region", { name: "Evidencias de Carlos Mendoza Ríos" })
    ).toBeInTheDocument();
  });

  it("no muestra datos privados cuando el titular no autorizó contacto ni CV", async () => {
    renderWithQuery(<MatchingPage />);
    await screen.findByText(/2 candidatos/i);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar candidato" }), {
      target: { value: "Lucía" },
    });
    await screen.findByText(/Compatibilidad vs\. Tech Lead/i);

    expect(
      screen.getByText(
        "El candidato no autorizó compartir sus datos de contacto."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("El candidato no autorizó compartir su CV.")
    ).toBeInTheDocument();
    expect(screen.queryByText("carlos@example.com")).not.toBeInTheDocument();
  });

  it("registra la decisión del reclutador sobre una postulación", async () => {
    renderWithQuery(<MatchingPage />);
    await screen.findByText(/2 candidatos/i);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar candidato" }), {
      target: { value: "Lucía" },
    });
    await screen.findByRole("button", { name: "Rechazar postulación" });

    fireEvent.click(screen.getByRole("button", { name: "Rechazar postulación" }));

    await waitFor(() => {
      expect(radarRecruiterApi.decide).toHaveBeenCalledWith(
        "app-lucia",
        "rejected"
      );
    });
  });

  it("muestra un error de vacantes y permite reintentar", async () => {
    vi.mocked(radarRecruiterApi.vacancies).mockRejectedValueOnce(
      new Error("fallo de red")
    );

    renderWithQuery(<MatchingPage />);

    expect(
      await screen.findByText("No se pudieron cargar las vacantes publicadas.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar vacantes" }));

    await screen.findByText(/2 candidatos/i);
  });

  it("muestra un error de postulantes y permite reintentar", async () => {
    vi.mocked(radarRecruiterApi.applicants).mockRejectedValueOnce(
      new Error("fallo de red")
    );

    renderWithQuery(<MatchingPage />);

    expect(
      await screen.findByText(
        "No se pudieron cargar los postulantes de esta vacante."
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar candidatos" }));

    await screen.findByText(/2 candidatos/i);
  });

  it("muestra un estado vacío cuando no hay vacantes publicadas", async () => {
    vi.mocked(radarRecruiterApi.vacancies).mockResolvedValueOnce([]);

    renderWithQuery(<MatchingPage />);

    expect(
      await screen.findByText(
        "No hay vacantes publicadas en las empresas vinculadas a tu sesión."
      )
    ).toBeInTheDocument();
  });
});
