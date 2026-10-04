import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RejectionReasonNotice } from "./rejection-reason-notice";

describe("RejectionReasonNotice", () => {
  afterEach(() => cleanup());

  it("shows the rejection reason when the request is rejected", () => {
    render(
      <RejectionReasonNotice
        status="REJECTED"
        rejectionReason="El documento está ilegible, sube una foto más clara."
      />,
    );

    expect(screen.getByRole("heading", { name: "Solicitud rechazada" })).toBeInTheDocument();
    expect(screen.getByText("Motivo del rechazo")).toBeInTheDocument();
    expect(screen.getByTestId("rejection-reason")).toHaveTextContent(
      "El documento está ilegible, sube una foto más clara.",
    );
  });

  it.each(["DRAFT", "PENDING", "IN_REVIEW", "APPROVED"] as const)(
    "renders nothing when the status is %s",
    (status) => {
      const { container } = render(
        <RejectionReasonNotice status={status} rejectionReason="Motivo previo" />,
      );

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("shows a fallback message when a rejected request has no reason", () => {
    render(<RejectionReasonNotice status="REJECTED" rejectionReason={null} />);

    expect(screen.getByTestId("rejection-reason")).toHaveTextContent(
      "El revisor no registró un motivo",
    );
  });

  it("treats a reason with only spaces as missing", () => {
    render(<RejectionReasonNotice status="REJECTED" rejectionReason="   " />);

    expect(screen.getByTestId("rejection-reason")).toHaveTextContent(
      "El revisor no registró un motivo",
    );
  });
});
