import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSurveyState } from "../testing/survey-fixtures";
import type { QuestionCardProps } from "../types/survey-component-props.types";
import { QuestionCard } from "./question-card";

const QUESTION = buildSurveyState().questions[0];

function renderCard(overrides: Partial<QuestionCardProps> = {}) {
  const props: QuestionCardProps = {
    question: QUESTION,
    index: 0,
    isActive: true,
    isDragging: false,
    isDropTarget: false,
    shouldFocusStatement: false,
    errors: {},
    canMoveUp: false,
    canMoveDown: true,
    onActivate: vi.fn(),
    onStatementChange: vi.fn(),
    onTypeChange: vi.fn(),
    onToggleRequired: vi.fn(),
    onAddOption: vi.fn(),
    onRemoveOption: vi.fn(),
    onOptionChange: vi.fn(),
    onDuplicate: vi.fn(),
    onRemove: vi.fn(),
    onAddQuestionAfter: vi.fn(),
    onPreview: vi.fn(),
    onMove: vi.fn(),
    onFocusHandled: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnter: vi.fn(),
    onDragEnd: vi.fn(),
    onDrop: vi.fn(),
    ...overrides,
  };
  render(<QuestionCard {...props} />);
  return { props, user: userEvent.setup() };
}

describe("QuestionCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("en modo activo muestra enunciado, tipo, opciones, pie y barra flotante", () => {
    renderCard();

    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveValue(QUESTION.statement);
    expect(screen.getByRole("combobox", { name: "Tipo de pregunta" })).toHaveTextContent("Opción única");
    expect(screen.getByLabelText("Texto de la opción 1")).toHaveValue("Empleado");
    expect(screen.getByRole("button", { name: "Añadir opción" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Obligatoria" })).toBeChecked();
    expect(screen.getByRole("toolbar", { name: "Acciones de la pregunta" })).toBeInTheDocument();
    expect(screen.getByTestId("question-card-1").querySelector('[data-active="true"]')).not.toBeNull();
  });

  it("notifica cada acción de edición", async () => {
    const { props, user } = renderCard();

    await user.type(screen.getByLabelText("Enunciado de la pregunta 1"), "?");
    await user.type(screen.getByLabelText("Texto de la opción 2"), "!");
    await user.click(screen.getByRole("button", { name: "Añadir opción" }));
    await user.click(screen.getByRole("switch", { name: "Obligatoria" }));
    await user.click(screen.getAllByRole("button", { name: "Duplicar pregunta" })[0]);
    await user.click(screen.getByRole("button", { name: "Eliminar pregunta" }));
    await user.click(screen.getByRole("button", { name: "Añadir pregunta" }));
    await user.click(screen.getByRole("button", { name: "Vista previa" }));

    expect(props.onStatementChange).toHaveBeenCalledWith(QUESTION.id, `${QUESTION.statement}?`);
    expect(props.onOptionChange).toHaveBeenCalledWith(QUESTION.id, "o2", "Independiente!");
    expect(props.onAddOption).toHaveBeenCalledWith(QUESTION.id);
    expect(props.onToggleRequired).toHaveBeenCalledWith(QUESTION.id);
    expect(props.onDuplicate).toHaveBeenCalledWith(QUESTION.id);
    expect(props.onRemove).toHaveBeenCalledWith(QUESTION.id);
    expect(props.onAddQuestionAfter).toHaveBeenCalledWith(0);
    expect(props.onPreview).toHaveBeenCalled();
  });

  it("solo permite quitar opciones cuando hay más de 2", async () => {
    const { props, user } = renderCard({
      question: { ...QUESTION, options: [...QUESTION.options, { id: "o3", label: "Otro" }] },
    });

    await user.click(screen.getByRole("button", { name: "Eliminar opción 3" }));

    expect(props.onRemoveOption).toHaveBeenCalledWith(QUESTION.id, "o3");
  });

  it("enfoca el enunciado cuando se lo pide el editor", () => {
    const { props } = renderCard({ shouldFocusStatement: true });

    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveFocus();
    expect(props.onFocusHandled).toHaveBeenCalled();
  });

  it("enfoca la opción recién creada", () => {
    const { props } = renderCard({ focusOptionId: "o2" });

    expect(screen.getByLabelText("Texto de la opción 2")).toHaveFocus();
    expect(props.onFocusHandled).toHaveBeenCalled();
  });

  it("muestra los errores del enunciado y de las opciones en rojo", () => {
    renderCard({
      errors: {
        "questions.0.statement": "El enunciado de la pregunta es obligatorio",
        "questions.0.options": "La pregunta debe tener al menos 2 opciones",
      },
    });

    expect(screen.getByText("El enunciado de la pregunta es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La pregunta debe tener al menos 2 opciones")).toBeInTheDocument();
    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("question-card-1").querySelector('[data-invalid="true"]')).not.toBeNull();
  });

  it("en modo resumen muestra enunciado, asterisco, tipo y cantidad de opciones y se activa con clic o teclado", async () => {
    const { props, user } = renderCard({ isActive: false, index: 2 });
    const summary = screen.getByRole("button", { name: "Editar pregunta 3" });

    expect(summary).toHaveTextContent(`3. ${QUESTION.statement}*`);
    expect(summary).toHaveTextContent("Opción única");
    expect(summary).toHaveTextContent("2 opciones");
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();

    await user.click(summary);
    summary.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    await user.keyboard("a");

    expect(props.onActivate).toHaveBeenCalledTimes(3);
  });

  it("resume una pregunta opcional sin título", () => {
    renderCard({ isActive: false, question: { ...QUESTION, statement: "", isRequired: false, type: "multiple_choice" } });
    const summary = screen.getByRole("button", { name: "Editar pregunta 1" });

    expect(summary).toHaveTextContent("1. Pregunta sin título");
    expect(summary).not.toHaveTextContent("*");
    expect(summary).toHaveTextContent("Opción múltiple");
  });

  it("reordena con las flechas del teclado desde el manejador", async () => {
    const { props, user } = renderCard({ index: 1, canMoveUp: true, canMoveDown: true });

    screen.getByRole("button", { name: /^Reordenar pregunta 2/ }).focus();
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowLeft}");

    expect(props.onMove).toHaveBeenNthCalledWith(1, 1, 0);
    expect(props.onMove).toHaveBeenNthCalledWith(2, 1, 2);
    expect(props.onMove).toHaveBeenCalledTimes(2);
  });

  it("no mueve fuera de los límites", async () => {
    const { props, user } = renderCard({ canMoveUp: false, canMoveDown: false });

    screen.getByRole("button", { name: /^Reordenar pregunta 1/ }).focus();
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowDown}");

    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("solo es arrastrable desde el manejador y emite los eventos de arrastre", () => {
    const { props } = renderCard({ isDragging: true, isDropTarget: true });
    const card = screen.getByTestId("question-card-1");
    const handle = screen.getByRole("button", { name: /^Reordenar/ });
    const dataTransfer = { effectAllowed: "", setData: vi.fn() };

    expect(card).toHaveAttribute("draggable", "false");
    fireEvent.pointerDown(handle);
    expect(card).toHaveAttribute("draggable", "true");
    fireEvent.pointerUp(handle);
    expect(card).toHaveAttribute("draggable", "false");

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragEnter(card, { dataTransfer });
    fireEvent.dragOver(card, { dataTransfer });
    fireEvent.drop(card, { dataTransfer });
    fireEvent.dragEnd(card, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", QUESTION.id);
    expect(props.onDragStart).toHaveBeenCalledWith(0);
    expect(props.onDragEnter).toHaveBeenCalledWith(0);
    expect(props.onDrop).toHaveBeenCalledWith(0);
    expect(props.onDragEnd).toHaveBeenCalled();
    expect(card).toHaveClass("opacity-50");
  });
});
