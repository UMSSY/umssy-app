import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRequirementsSkillsPreview } from "../hooks/use-requirements-skills-preview";
import { useSkillsCatalog } from "../hooks/use-skills-catalog";
import { DOCKER, EMPTY_CONDITIONS, KUBERNETES, PYTHON } from "../testing/vacancy-fixtures";
import type { SkillOption } from "../types/skill-option.types";
import type { UpdateVacancyField } from "../types/update-vacancy-field.types";
import type { VacancyConditions } from "../types/vacancy-conditions.types";
import { RequirementsStep } from "./requirements-step";

vi.mock("../hooks/use-skills-catalog", () => ({ useSkillsCatalog: vi.fn() }));
vi.mock("../hooks/use-requirements-skills-preview", () => ({ useRequirementsSkillsPreview: vi.fn() }));

const NO_SKILLS: SkillOption[] = [];
const DETECTED_PYTHON = [PYTHON];
const DETECTED_THREE = [PYTHON, DOCKER, KUBERNETES];

const preview = (overrides: Partial<ReturnType<typeof useRequirementsSkillsPreview>> = {}) => ({
  detectedSkills: NO_SKILLS,
  processingTimeMs: undefined,
  isAnalyzing: false,
  isError: false,
  ...overrides,
});

function detectWhenTextMentions(keyword: string, detected: SkillOption[]) {
  vi.mocked(useRequirementsSkillsPreview).mockImplementation((description) =>
    description.includes(keyword) ? preview({ detectedSkills: detected, processingTimeMs: 320 }) : preview(),
  );
}

function StatefulStep({ initial }: { initial: Partial<VacancyConditions> }) {
  const [conditions, setConditions] = useState<VacancyConditions>({ ...EMPTY_CONDITIONS, ...initial });
  const updateField: UpdateVacancyField = (field, value) =>
    setConditions((previous) => ({ ...previous, [field]: value }));

  return (
    <RequirementsStep
      conditions={conditions}
      errors={{}}
      updateField={updateField}
      onPrevious={vi.fn()}
      onContinue={vi.fn()}
    />
  );
}

const typeDescription = (value: string) =>
  fireEvent.change(screen.getByLabelText(/Descripción del puesto/), { target: { value } });
const hasSkill = (name: string) => screen.queryByRole("button", { name: `Quitar ${name}` }) !== null;

function addFromDialog(search: string, name: string) {
  fireEvent.click(screen.getByRole("button", { name: "+ Añadir habilidad" }));
  fireEvent.change(screen.getByLabelText(/Buscar tecnología/), { target: { value: search } });
  fireEvent.click(screen.getByRole("button", { name }));
  fireEvent.click(screen.getByRole("button", { name: "Añadir habilidad" }));
}

const catalogReady = (skills = [PYTHON, DOCKER, KUBERNETES]) => ({ skills, status: "ready" as const, reload: vi.fn() });

function renderStep(overrides: Partial<React.ComponentProps<typeof RequirementsStep>> = {}) {
  const props = {
    conditions: EMPTY_CONDITIONS,
    errors: {},
    updateField: vi.fn(),
    onPrevious: vi.fn(),
    onContinue: vi.fn(),
    ...overrides,
  };
  render(<RequirementsStep {...props} />);
  return props;
}

describe("RequirementsStep", () => {
  beforeEach(() => {
    vi.mocked(useSkillsCatalog).mockReturnValue(catalogReady());
    vi.mocked(useRequirementsSkillsPreview).mockReturnValue(preview());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra solo las habilidades seleccionadas y el botón para añadir", () => {
    renderStep({ conditions: { ...EMPTY_CONDITIONS, skills: [PYTHON, DOCKER] } });

    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.queryByText("Kubernetes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Añadir habilidad" })).toBeInTheDocument();
  });

  it("no despliega el catálogo completo cuando no hay habilidades", () => {
    renderStep();

    ["Python", "Docker", "Kubernetes"].forEach((name) => expect(screen.queryByText(name)).not.toBeInTheDocument());
    expect(screen.getByText(/Todavía no hay habilidades/)).toBeInTheDocument();
  });

  it("quita una habilidad con su X", () => {
    const { updateField } = renderStep({ conditions: { ...EMPTY_CONDITIONS, skills: [PYTHON, DOCKER] } });

    fireEvent.click(screen.getByRole("button", { name: "Quitar Python" }));

    expect(updateField).toHaveBeenCalledWith("skills", [DOCKER]);
  });

  it("agrega la tecnología elegida en el pop up sin duplicarla", () => {
    const { updateField } = renderStep({ conditions: { ...EMPTY_CONDITIONS, skills: [DOCKER] } });

    addFromDialog("pyth", "Python");

    expect(updateField).toHaveBeenCalledWith("skills", [DOCKER, PYTHON]);
  });

  it("no deja elegir más de 10 tecnologías", () => {
    const catalog = Array.from({ length: 11 }, (_, index) => ({ id: `id-${index}`, name: `Tech ${index}` }));
    vi.mocked(useSkillsCatalog).mockReturnValue(catalogReady(catalog));
    const { updateField } = renderStep({ conditions: { ...EMPTY_CONDITIONS, skills: catalog.slice(0, 10) } });

    expect(screen.getByRole("button", { name: "+ Añadir habilidad" })).toBeDisabled();
    expect(screen.getByText(/máximo de 10 habilidades/)).toBeInTheDocument();
    expect(screen.queryByText("Tech 10")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar Tech 0" })).toBeEnabled();
    expect(updateField).not.toHaveBeenCalled();
  });

  it("presenta el apartado de todas las habilidades sin listar el catálogo", () => {
    renderStep();

    expect(screen.getByRole("heading", { level: 3, name: "Todas las habilidades" })).toBeInTheDocument();
    expect(screen.getByText(/se agregan solas/)).toBeInTheDocument();
    ["Python", "Docker", "Kubernetes"].forEach((name) =>
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument(),
    );
  });

  it("muestra las habilidades detectadas en la descripción con el tiempo del análisis", () => {
    vi.mocked(useRequirementsSkillsPreview).mockReturnValue(
      preview({ detectedSkills: DETECTED_PYTHON, processingTimeMs: 320 }),
    );
    renderStep({ conditions: { ...EMPTY_CONDITIONS, description: "Buscamos Python" } });

    expect(screen.getByText("Habilidades detectadas automáticamente")).toBeInTheDocument();
    expect(screen.getByText("Análisis completado en 0.32 s")).toBeInTheDocument();
  });

  it("indica que está analizando mientras la consulta está en curso", () => {
    vi.mocked(useRequirementsSkillsPreview).mockReturnValue(preview({ isAnalyzing: true }));
    renderStep({ conditions: { ...EMPTY_CONDITIONS, description: "Buscamos Python" } });

    expect(screen.getByRole("status")).toHaveTextContent("Analizando con NLP...");
  });

  it("no muestra el recuadro de detección cuando no hay habilidades detectadas", () => {
    renderStep({ conditions: { ...EMPTY_CONDITIONS, description: "Buscamos personas responsables" } });

    expect(screen.queryByText("Habilidades detectadas automáticamente")).not.toBeInTheDocument();
  });

  it("avisa si la detección falla y deja añadir las habilidades a mano", () => {
    vi.mocked(useRequirementsSkillsPreview).mockReturnValue(preview({ isError: true }));
    const { updateField } = renderStep({ conditions: { ...EMPTY_CONDITIONS, description: "Buscamos Python" } });

    expect(screen.getByText(/No se pudieron detectar habilidades en este momento/)).toBeInTheDocument();
    addFromDialog("pyth", "Python");

    expect(updateField).toHaveBeenCalledWith("skills", [PYTHON]);
  });

  it("agrega solas las habilidades detectadas al escribir la descripción", () => {
    detectWhenTextMentions("Python", DETECTED_PYTHON);
    render(<StatefulStep initial={{}} />);

    expect(hasSkill("Python")).toBe(false);
    typeDescription("Necesitamos Python");

    expect(hasSkill("Python")).toBe(true);
    expect(hasSkill("Docker")).toBe(false);
  });

  it("no cambia las habilidades al abrir una vacante con la descripción ya escrita", () => {
    detectWhenTextMentions("Python", DETECTED_PYTHON);
    render(<StatefulStep initial={{ description: "Necesitamos Python", skills: [DOCKER] }} />);

    expect(hasSkill("Python")).toBe(false);
    expect(hasSkill("Docker")).toBe(true);
  });

  it("respeta la habilidad que el usuario quita después de la detección", () => {
    detectWhenTextMentions("Python", DETECTED_PYTHON);
    render(<StatefulStep initial={{}} />);
    typeDescription("Necesitamos Python");
    expect(hasSkill("Python")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Quitar Python" }));
    typeDescription("Necesitamos Python y trabajo en equipo");

    expect(hasSkill("Python")).toBe(false);
  });

  it("vuelve a agregar una habilidad quitada si el usuario la añade de nuevo", () => {
    detectWhenTextMentions("Python", DETECTED_PYTHON);
    render(<StatefulStep initial={{}} />);
    typeDescription("Necesitamos Python");
    fireEvent.click(screen.getByRole("button", { name: "Quitar Python" }));
    expect(hasSkill("Python")).toBe(false);

    addFromDialog("pyth", "Python");

    expect(hasSkill("Python")).toBe(true);
  });

  it("no agrega habilidades detectadas por encima del máximo de 10", () => {
    const selected = Array.from({ length: 9 }, (_, index) => ({ id: `id-${index}`, name: `Tech ${index}` }));
    detectWhenTextMentions("Python", DETECTED_THREE);
    render(<StatefulStep initial={{ skills: selected }} />);

    typeDescription("Necesitamos Python, Docker y Kubernetes");

    expect(hasSkill("Python")).toBe(true);
    expect(hasSkill("Docker")).toBe(false);
    expect(hasSkill("Kubernetes")).toBe(false);
    expect(screen.getByText(/máximo de 10 habilidades/)).toBeInTheDocument();
  });

  it("actualiza la descripción conservando saltos de línea y respetando el tope", () => {
    const { updateField } = renderStep();
    const textarea = screen.getByLabelText(/Descripción del puesto/);

    fireEvent.change(textarea, { target: { value: "Línea 1\n- Línea 2" } });
    expect(updateField).toHaveBeenLastCalledWith("description", "Línea 1\n- Línea 2");

    fireEvent.change(textarea, { target: { value: "a".repeat(3005) } });
    expect(updateField).toHaveBeenLastCalledWith("description", "a".repeat(3000));
    expect(textarea).toHaveAttribute("maxlength", "3000");
  });

  it("muestra el contador de caracteres y lo resalta al llegar al tope", () => {
    renderStep({ conditions: { ...EMPTY_CONDITIONS, description: "Hola" } });
    expect(screen.getByText("4/3000")).toBeInTheDocument();

    cleanup();
    renderStep({ conditions: { ...EMPTY_CONDITIONS, description: "a".repeat(3000) } });
    expect(screen.getByText("3000/3000")).toHaveClass("text-danger");
  });

  it("muestra los errores de la descripción y de las habilidades", () => {
    renderStep({ errors: { description: "Este campo es obligatorio", skills: "Debes seleccionar al menos una habilidad requerida" } });

    expect(screen.getByText("Este campo es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("Debes seleccionar al menos una habilidad requerida")).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción del puesto/)).toHaveAttribute("aria-invalid", "true");
  });

  it("informa que se está cargando el catálogo", () => {
    vi.mocked(useSkillsCatalog).mockReturnValue({ skills: [], status: "loading", reload: vi.fn() });
    renderStep();

    expect(screen.getByText("Cargando habilidades...")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Añadir habilidad" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Python" })).not.toBeInTheDocument();
  });

  it("permite reintentar si el catálogo no se pudo cargar", () => {
    const reload = vi.fn();
    vi.mocked(useSkillsCatalog).mockReturnValue({ skills: [], status: "error", reload });
    renderStep();

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el catálogo de habilidades.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(reload).toHaveBeenCalledOnce();
  });

  it("navega con Anterior y Continuar", () => {
    const { onPrevious, onContinue } = renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
