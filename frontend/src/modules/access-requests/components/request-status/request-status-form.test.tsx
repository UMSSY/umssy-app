import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestStatusForm } from "./request-status-form";

describe("RequestStatusForm", () => {
  afterEach(cleanup);

  it("solicita únicamente el correo y empieza con Continuar deshabilitado", () => {
    const onLookup = vi.fn().mockResolvedValue(undefined);
    render(<RequestStatusForm isLoading={false} onLookup={onLookup} />);

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("");
    expect(screen.queryByLabelText("Código de solicitud")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    expect(onLookup).not.toHaveBeenCalled();
  });

  it("envía solo el correo al continuar", async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn().mockResolvedValue(undefined);
    render(<RequestStatusForm isLoading={false} onLookup={onLookup} />);

    await user.type(screen.getByLabelText("Correo electrónico"), "ana@umss.edu.bo");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onLookup).toHaveBeenCalledTimes(1);

    expect(onLookup).toHaveBeenCalledWith("ana@umss.edu.bo");
  });

  it("permite continuar con Enter", async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn().mockResolvedValue(undefined);
    render(<RequestStatusForm isLoading={false} onLookup={onLookup} />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ana@umss.edu.bo{Enter}",
    );

    expect(onLookup).toHaveBeenCalledTimes(1);

    expect(onLookup).toHaveBeenCalledWith("ana@umss.edu.bo");
  });

  it.each(["", "correo-invalido"])(
    "bloquea un correo inválido incluso en un envío programático: %j",
    (email) => {
      const onLookup = vi.fn().mockResolvedValue(undefined);
      render(<RequestStatusForm isLoading={false} onLookup={onLookup} />);

      fireEvent.change(screen.getByLabelText("Correo electrónico"), {
        target: { value: email },
      });
      fireEvent.submit(
        screen.getByRole("form", { name: "Verificar correo de la solicitud" }),
      );

      expect(screen.getByLabelText("Correo electrónico")).toBeInvalid();
      expect(onLookup).not.toHaveBeenCalled();
    },
  );

  it("bloquea controles y envíos mientras consulta", () => {
    const onLookup = vi.fn().mockResolvedValue(undefined);
    render(<RequestStatusForm isLoading onLookup={onLookup} />);

    const form = screen.getByRole("form", {
      name: "Verificar correo de la solicitud",
    });

    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Consultando..." })).toBeDisabled();

    fireEvent.submit(form);

    expect(onLookup).not.toHaveBeenCalled();
  });

  it("conserva el correo al terminar la carga y permite reintentar", async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <RequestStatusForm isLoading={false} onLookup={onLookup} />,
    );

    await user.type(screen.getByLabelText("Correo electrónico"), "ana@umss.edu.bo");

    rerender(<RequestStatusForm isLoading onLookup={onLookup} />);
    rerender(<RequestStatusForm isLoading={false} onLookup={onLookup} />);

    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("ana@umss.edu.bo");

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onLookup).toHaveBeenCalledTimes(1);

    expect(onLookup).toHaveBeenCalledWith("ana@umss.edu.bo");
  });
});
