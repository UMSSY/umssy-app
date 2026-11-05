import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ModalityIcon } from "./modality-icon";

afterEach(cleanup);

describe("ModalityIcon", () => {
  it.each(["Presencial", "Remoto", "Híbrido", "Virtual"])(
    "renders an icon hidden from assistive technology for %s",
    (modality) => {
      const { container } = render(<ModalityIcon modality={modality} className="size-4" />);

      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveClass("size-4");
    },
  );
});
