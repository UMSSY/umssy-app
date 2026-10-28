import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuestionTypeSelect } from "./question-type-select";

describe("QuestionTypeSelect", () => {
  afterEach(() => {
    cleanup();
  });

  it("ofrece únicamente opción única y opción múltiple", async () => {
    const user = userEvent.setup();
    render(<QuestionTypeSelect id="type" value="single_choice" onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox", { name: "Tipo de pregunta" }));

    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      "Opción única",
      "Opción múltiple",
    ]);
  });

  it("muestra el tipo actual y notifica el nuevo tipo", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuestionTypeSelect id="type" value="single_choice" onChange={onChange} />);

    expect(screen.getByRole("combobox", { name: "Tipo de pregunta" })).toHaveTextContent("Opción única");

    await user.click(screen.getByRole("combobox", { name: "Tipo de pregunta" }));
    await user.click(await screen.findByRole("option", { name: "Opción múltiple" }));

    expect(onChange).toHaveBeenCalledWith("multiple_choice");
  });
});
