import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { SkillsSelector } from "./skills-selector";
import { SkillItem } from "../types/skill-item.types";

const mockCatalog: SkillItem[] = [
  { id: "1", name: "React" },
  { id: "2", name: "TypeScript" },
];

describe("SkillsSelector", () => {
  afterEach(() => {
    cleanup();
  });

  it("filters skills by search term and shows empty message when no matches", async () => {
    const user = userEvent.setup();
    render(
      <SkillsSelector
        catalogSkills={mockCatalog}
        selectedSkills={[]}
        onAddSkill={vi.fn()}
        onRemoveSkill={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText("Buscar en el catálogo");
    await user.type(input, "Python");

    expect(
      screen.getByText("No se encontraron coincidencias en el catálogo.")
    ).toBeInTheDocument();
  });

  it("triggers onAddSkill when clicking Añadir button", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <SkillsSelector
        catalogSkills={mockCatalog}
        selectedSkills={[]}
        onAddSkill={handleAdd}
        onRemoveSkill={vi.fn()}
      />
    );

    const addButton = screen.getAllByRole("button", { name: /añadir/i })[0];
    await user.click(addButton);

    expect(handleAdd).toHaveBeenCalledWith(mockCatalog[0]);
  });

  it("triggers onRemoveSkill when clicking the X button on a badge", async () => {
    const user = userEvent.setup();
    const handleRemove = vi.fn();
    render(
      <SkillsSelector
        catalogSkills={mockCatalog}
        selectedSkills={[{ id: "1", name: "React" }]}
        onAddSkill={vi.fn()}
        onRemoveSkill={handleRemove}
      />
    );

    const removeButton = screen.getByRole("button", { name: /eliminar react/i });
    await user.click(removeButton);

    expect(handleRemove).toHaveBeenCalledWith("1");
  });

  it("creates custom skill when input is valid", async () => {
    const user = userEvent.setup();
    const handleCreateCustom = vi.fn();
    render(
      <SkillsSelector
        catalogSkills={mockCatalog}
        selectedSkills={[]}
        onAddSkill={vi.fn()}
        onRemoveSkill={vi.fn()}
        onCreateCustomSkill={handleCreateCustom}
      />
    );

    const input = screen.getByPlaceholderText("Ej. Docker");
    const submitBtn = screen.getByRole("button", { name: "Agregar" });

    await user.type(input, "Docker");
    await user.click(submitBtn);

    expect(handleCreateCustom).toHaveBeenCalledWith("Docker");
  });

  it("shows error when trying to add an empty custom skill", async () => {
    const user = userEvent.setup();
    render(
      <SkillsSelector
        catalogSkills={mockCatalog}
        selectedSkills={[]}
        onAddSkill={vi.fn()}
        onRemoveSkill={vi.fn()}
        onCreateCustomSkill={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole("button", { name: "Agregar" });
    await user.click(submitBtn);

    expect(
      screen.getByText("El nombre no puede estar vacío")
    ).toBeInTheDocument();
  });

  it("shows error when custom skill already exists in selectedSkills", async () => {
    const user = userEvent.setup();
    render(
      <SkillsSelector
        catalogSkills={mockCatalog}
        selectedSkills={[{ id: "1", name: "React" }]}
        onAddSkill={vi.fn()}
        onRemoveSkill={vi.fn()}
        onCreateCustomSkill={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText("Ej. Docker");
    const submitBtn = screen.getByRole("button", { name: "Agregar" });

    await user.type(input, "react");
    await user.click(submitBtn);

    expect(
      screen.getByText("Esta habilidad ya está agregada")
    ).toBeInTheDocument();
  });
});