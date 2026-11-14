import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { ContactApplicationButton } from "./contact-application-button";

afterEach(cleanup);

describe("ContactApplicationButton", () => {
  it("asks to contact the recruiter of its application", () => {
    const onContact = vi.fn();
    const application = buildApplication({ id: "application-7" });
    render(<ContactApplicationButton application={application} contactingId={null} onContact={onContact} />);

    fireEvent.click(screen.getByRole("button", { name: "Contactar" }));

    expect(onContact).toHaveBeenCalledWith(application);
  });

  it("shows that the chat is being opened and blocks a second click", () => {
    const onContact = vi.fn();
    render(
      <ContactApplicationButton
        application={buildApplication({ id: "application-7" })}
        contactingId="application-7"
        onContact={onContact}
      />,
    );

    const button = screen.getByRole("button", { name: "Abriendo chat…" });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onContact).not.toHaveBeenCalled();
  });

  it("blocks the button while the chat of another application is being opened", () => {
    render(
      <ContactApplicationButton
        application={buildApplication({ id: "application-8" })}
        contactingId="application-7"
        onContact={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Contactar" })).toBeDisabled();
  });
});
