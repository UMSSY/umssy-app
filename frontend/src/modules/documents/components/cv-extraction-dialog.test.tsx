import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionDialogProps } from "../types/cv-extraction-dialog-props.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { CvExtractionDialog } from "./cv-extraction-dialog";

vi.mock("@/modules/profile/services/profile.service", () => ({
  profileService: {
    getCities: vi.fn().mockResolvedValue([{ id: "city-cbba", title: "Cochabamba" }]),
  },
}));

vi.mock("@/modules/education/services/educations.service", () => ({
  educationsService: {
    getInstitutions: vi.fn().mockResolvedValue([
      { name: "Universidad Mayor de San Simón (UMSS)", aliases: ["UMSS"] },
    ]),
    getDegrees: vi.fn().mockResolvedValue([
      {
        institution: "Universidad Mayor de San Simón (UMSS)",
        degrees: [{ name: "Licenciatura en Ingeniería de Sistemas", aliases: [] }],
      },
    ]),
  },
}));

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: {
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@mail.com",
    phone: null,
    location: "Cochabamba, Bolivia",
    cityId: "city-cbba",
  },
  presentation: { headline: "Desarrollador", aboutMe: "Ingeniero de sistemas" },
  educations: [
    {
      institution: "Universidad Mayor de San Simón (UMSS)",
      degree: "Licenciatura en Ingeniería de Sistemas",
      startDate: "2014-01-01",
      endDate: null,
      description: null,
    },
  ],
  workExperiences: [
    {
      companyName: "Empresa SRL",
      position: "Desarrollador Backend",
      startDate: "2021-03-01",
      endDate: null,
      isCurrent: true,
      description: "APIs REST",
    },
  ],
  skills: [
    { skillId: "skill-ts", name: "TypeScript" },
    { skillId: "skill-sql", name: "SQL" },
  ],
};

const FULL_SELECTION: CvExtractionSelection = {
  contact: ["firstName", "lastName", "email", "cityId"],
  presentation: [0],
  education: [0],
  experience: [0],
  skills: [0, 1],
};

function renderDialog(props: Partial<CvExtractionDialogProps> = {}) {
  const handlers = {
    onToggleItem: vi.fn(),
    onToggleSection: vi.fn(),
    onContactChange: vi.fn(),
    onPresentationChange: vi.fn(),
    onEducationChange: vi.fn(),
    onWorkExperienceChange: vi.fn(),
    onApply: vi.fn(),
    onClose: vi.fn(),
  };
  render(
    <CvExtractionDialog
      isOpen
      isExtracting={false}
      extraction={EXTRACTION}
      available={FULL_SELECTION}
      selection={FULL_SELECTION}
      {...handlers}
      {...props}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
}

describe("CvExtractionDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("organizes the extracted data by section with the number of detected items", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog", { name: "Revisar datos extraídos del CV" });

    expect(within(dialog).getByRole("tab", { name: "Contacto (4)" })).toBeInTheDocument();
    expect(within(dialog).getByRole("tab", { name: "Presentación (1)" })).toBeInTheDocument();
    expect(within(dialog).getByRole("tab", { name: "Formación académica (1)" })).toBeInTheDocument();
    expect(within(dialog).getByRole("tab", { name: "Experiencia laboral (1)" })).toBeInTheDocument();
    expect(within(dialog).getByRole("tab", { name: "Habilidades técnicas (2)" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Aplicar a mi perfil" })).toBeEnabled();
  });

  it("lets the user correct a contact field before applying it", async () => {
    const { onContactChange, user } = renderDialog();

    const firstName = await screen.findByRole("textbox", { name: "Nombres" });
    expect(firstName).toHaveValue("Juan");
    await user.type(firstName, "a");

    expect(onContactChange).toHaveBeenLastCalledWith({ firstName: "Juana" });
    expect(screen.getByText("En tu CV: Cochabamba, Bolivia")).toBeInTheDocument();
  });

  it("includes or excludes a whole section and each of its items", async () => {
    const { onToggleItem, onToggleSection, user } = renderDialog();

    await user.click(await screen.findByRole("checkbox", { name: "Incluir sección Contacto" }));
    await user.click(screen.getByRole("checkbox", { name: "Incluir Correo personal" }));

    expect(onToggleSection).toHaveBeenCalledWith("contact");
    expect(onToggleItem).toHaveBeenCalledWith("contact", "email");
  });

  it("shows the section as partially selected when some items are unchecked", async () => {
    renderDialog({ selection: { ...FULL_SELECTION, contact: ["firstName"] } });

    const sectionCheckbox = await screen.findByRole("checkbox", { name: "Incluir sección Contacto" });

    expect(sectionCheckbox).toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByText("1 de 4 seleccionados")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Incluir Nombres" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Incluir Apellidos" })).not.toBeChecked();
  });

  it("lets the user edit the presentation and requires a headline", async () => {
    const { onPresentationChange, user } = renderDialog({
      extraction: { ...EXTRACTION, presentation: { headline: null, aboutMe: "Ingeniero de sistemas" } },
    });

    await user.click(await screen.findByRole("tab", { name: "Presentación (1)" }));
    await user.type(screen.getByLabelText(/Acerca de mí/), "!");

    expect(onPresentationChange).toHaveBeenLastCalledWith({ aboutMe: "Ingeniero de sistemas!" });
    expect(screen.getByText("Ingresa un titular para aplicar tu presentación.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar a mi perfil" })).toBeDisabled();
  });

  it("does not ask for a headline when the presentation is excluded", async () => {
    const { user } = renderDialog({
      extraction: { ...EXTRACTION, presentation: { headline: null, aboutMe: "Ingeniero" } },
      selection: { ...FULL_SELECTION, presentation: [] },
    });

    await user.click(await screen.findByRole("tab", { name: "Presentación (1)" }));

    expect(screen.queryByLabelText(/Titular/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar a mi perfil" })).toBeEnabled();
  });

  it("lets the user edit a work experience and flags incomplete studies", async () => {
    const { onWorkExperienceChange, onToggleItem, user } = renderDialog();

    await user.click(await screen.findByRole("tab", { name: "Experiencia laboral (1)" }));
    await user.type(screen.getByRole("textbox", { name: /Cargo/ }), "a");
    await user.click(screen.getByRole("checkbox", { name: "Trabajo actualmente aquí" }));

    expect(onWorkExperienceChange).toHaveBeenCalledWith(0, { position: "Desarrollador Backenda" });
    expect(onWorkExperienceChange).toHaveBeenLastCalledWith(0, { isCurrent: false });

    await user.click(screen.getByRole("tab", { name: "Formación académica (1)" }));
    const education = screen.getByRole("list", { name: "Formación académica" });

    expect(within(education).getByText("Incompleto")).toBeInTheDocument();
    await user.click(within(education).getByRole("checkbox", { name: /Incluir Licenciatura/ }));
    expect(onToggleItem).toHaveBeenCalledWith("education", 0);
  });

  it("toggles each detected skill", async () => {
    const { onToggleItem, user } = renderDialog({ selection: { ...FULL_SELECTION, skills: [0] } });

    await user.click(await screen.findByRole("tab", { name: "Habilidades técnicas (2)" }));

    expect(screen.getByRole("checkbox", { name: "Incluir TypeScript" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Incluir SQL" }));
    expect(onToggleItem).toHaveBeenCalledWith("skills", 1);
  });

  it("shows an empty message for a section without detected data", async () => {
    const { user } = renderDialog({
      available: { ...FULL_SELECTION, skills: [] },
      selection: { ...FULL_SELECTION, skills: [] },
      extraction: { ...EXTRACTION, skills: [] },
    });

    await user.click(await screen.findByRole("tab", { name: "Habilidades técnicas (0)" }));

    expect(screen.getByText("No encontramos habilidades técnicas del catálogo en tu CV.")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Incluir sección Habilidades técnicas" })).not.toBeInTheDocument();
  });

  it("applies the selection or cancels without applying anything", async () => {
    const { onApply, onClose, user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Aplicar a mi perfil" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables applying when nothing is selected", async () => {
    renderDialog({ selection: CV_EMPTY_EXTRACTION_SELECTION });

    expect(await screen.findByRole("button", { name: "Aplicar a mi perfil" })).toBeDisabled();
  });

  it("shows the loading state while reading the cv", async () => {
    renderDialog({ isExtracting: true, extraction: null });

    expect(await screen.findByText("Leyendo los datos de tu CV...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aplicar a mi perfil" })).toBeDisabled();
  });

  it("shows the real error message", async () => {
    renderDialog({ extraction: null, errorMessage: "No se pudieron leer los datos de tu CV. Intenta de nuevo." });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudieron leer los datos de tu CV. Intenta de nuevo.",
    );
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("shows what was applied and what was not after a partial failure", async () => {
    renderDialog({
      applyReport: { applied: ["Contacto"], failed: ["Formación académica: Licenciatura"] },
    });

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Algunos datos no se pudieron aplicar");
    expect(alert).toHaveTextContent("Se aplicó: Contacto.");
    expect(alert).toHaveTextContent("No se aplicó: Formación académica: Licenciatura.");
  });

  it("blocks both actions while applying", async () => {
    renderDialog({ isApplying: true });

    expect(await screen.findByRole("button", { name: "Aplicando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
