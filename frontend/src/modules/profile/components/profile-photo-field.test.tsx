import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePhotoField } from "./profile-photo-field";

describe("ProfilePhotoField", () => {
  afterEach(() => {
    cleanup();
  });

  it("disables the upload button when there is no handler", () => {
    render(<ProfilePhotoField />);

    expect(screen.getByText("Foto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir fotografía" })).toBeDisabled();
  });

  it("calls the handler when the upload button is clicked", async () => {
    const onSelectPhoto = vi.fn();
    const user = userEvent.setup();
    render(<ProfilePhotoField onSelectPhoto={onSelectPhoto} />);

    await user.click(screen.getByRole("button", { name: "Subir fotografía" }));

    expect(onSelectPhoto).toHaveBeenCalledTimes(1);
  });
});
