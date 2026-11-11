import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionDialogProps } from "../types/cv-extraction-dialog-props.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { CvExtractionDialog } from "./cv-extraction-dialog";

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: { firstName: "Juan", lastName: "Pérez", email: "juan@mail.com", phone: null, location: null },
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
};

const FULL_SELECTION: CvExtractionSelection = {
  contactFields: ["firstName", "lastName", "email"],
  educations: [0],
  workExperiences: [0],
};

function renderDialog(props: Partial<CvExtractionDialogProps> = {}) {
  const handlers = {
    onToggleContactField: vi.fn(),
    onToggleEducation: vi.fn(),
    onToggleWorkExperience: vi.fn(),
    onApply: vi.fn(),
    onClose: vi.fn(),
  };
  render(
    <CvExtractionDialog
      isOpen
      isExtracting={false}
      extraction={EXTRACTION}
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
  });

  it("lists the detected contact data checked by default", async () => {
    renderDialog();

    const contact = await screen.findByRole("list", { name: "Datos de contacto" });
    expect(within(contact).getAllByRole("listitem")).toHaveLength(3);
    expect(within(contact).getByText("juan@mail.com")).toBeInTheDocument();
    expect(within(contact).getAllByRole("checkbox").every((box) => box.getAttribute("aria-checked") === "true")).toBe(
      true,
    );
    expect(screen.getByRole("tab", { name: "Educación (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Experiencia (1)" })).toBeInTheDocument();
  });

  it("toggles a contact field", async () => {
    const { onToggleContactField, user } = renderDialog();

    await user.click(await screen.findByText("juan@mail.com"));

    expect(onToggleContactField).toHaveBeenCalledWith("email");
  });

  it("shows education entries with their period and flags the incomplete ones", async () => {
    const { onToggleEducation, user } = renderDialog();

    await user.click(await screen.findByRole("tab", { name: "Educación (1)" }));
    const education = await screen.findByRole("list", { name: "Educación" });

    expect(within(education).getByText("Licenciatura en Ingeniería de Sistemas")).toBeInTheDocument();
    expect(within(education).getByText("ene 2014")).toBeInTheDocument();
    expect(within(education).getByText("Incompleto")).toBeInTheDocument();

    await user.click(within(education).getByRole("checkbox"));
    expect(onToggleEducation).toHaveBeenCalledWith(0);
  });

  it("shows current jobs with Actualidad", async () => {
    const { onToggleWorkExperience, user } = renderDialog();

    await user.click(await screen.findByRole("tab", { name: "Experiencia (1)" }));
    const experience = await screen.findByRole("list", { name: "Experiencia laboral" });

    expect(within(experience).getByText("Desarrollador Backend")).toBeInTheDocument();
    expect(within(experience).getByText("mar 2021 – Actualidad")).toBeInTheDocument();
    expect(within(experience).queryByText("Incompleto")).not.toBeInTheDocument();

    await user.click(within(experience).getByRole("checkbox"));
    expect(onToggleWorkExperience).toHaveBeenCalledWith(0);
  });

  it("applies the selection or closes without changes", async () => {
    const { onApply, onClose, user } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Usar datos seleccionados" }));
    await user.click(screen.getByRole("button", { name: "Ahora no" }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not allow applying an empty selection", async () => {
    renderDialog({ selection: { contactFields: [], educations: [], workExperiences: [] } });

    expect(await screen.findByRole("button", { name: "Usar datos seleccionados" })).toBeDisabled();
  });

  it("shows a loading state while the cv is read", async () => {
    renderDialog({ isExtracting: true, extraction: null });

    expect(await screen.findByText("Leyendo los datos de tu CV...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ahora no" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Usar datos seleccionados" })).toBeDisabled();
  });

  it("shows the real error message", async () => {
    renderDialog({ extraction: null, errorMessage: "No se pudieron leer los datos de tu CV. Intenta de nuevo." });

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron leer los datos de tu CV. Intenta de nuevo.");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("explains empty sections", async () => {
    renderDialog({
      extraction: { ...EXTRACTION, contact: { firstName: null, lastName: null, email: null, phone: null, location: null } },
    });

    expect(await screen.findByText("No encontramos datos de contacto en tu CV.")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
