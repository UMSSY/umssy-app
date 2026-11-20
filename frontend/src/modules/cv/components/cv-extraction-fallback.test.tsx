import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CvExtractionFallback } from "./cv-extraction-fallback";

describe("CvExtractionFallback", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the message with a retry and a link to fill the profile by hand", async () => {
    const onRetry = vi.fn();
    const onManualFill = vi.fn();
    const user = userEvent.setup();
    render(
      <CvExtractionFallback
        title="No pudimos autollenar tu perfil"
        message="Revisa tu conexión"
        canRetry
        onRetry={onRetry}
        onManualFill={onManualFill}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos autollenar tu perfil");
    expect(screen.getByRole("alert")).toHaveTextContent("Revisa tu conexión");
    expect(screen.getByRole("link", { name: "Llenar mi perfil a mano" })).toHaveAttribute("href", "/profile");

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("hides the retry when the error is not transient", () => {
    render(<CvExtractionFallback title="Error" message="PDF escaneado" onRetry={vi.fn()} onManualFill={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Llenar mi perfil a mano" })).toBeInTheDocument();
  });

  it("closes the review when the user chooses to fill the profile by hand", async () => {
    const onManualFill = vi.fn();
    const user = userEvent.setup();
    render(<CvExtractionFallback title="Error" message="PDF escaneado" onManualFill={onManualFill} />);

    await user.click(screen.getByRole("link", { name: "Llenar mi perfil a mano" }));

    expect(onManualFill).toHaveBeenCalledTimes(1);
  });
});
