import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { OtpInput } from "./otp-input";

describe("OtpInput", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders 6 digits by default", () => {
    render(<OtpInput value="" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("handles typing digits and moving forward", () => {
    const onChange = vi.fn();
    render(<OtpInput value="1" onChange={onChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith("12");
  });

  it("handles backspace to delete previous digit", () => {
    const onChange = vi.fn();
    render(<OtpInput value="12" onChange={onChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[2], { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("handles arrow navigation", () => {
    render(<OtpInput value="123" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");

    fireEvent.keyDown(inputs[1], { key: "ArrowRight" });
    fireEvent.keyDown(inputs[1], { key: "ArrowLeft" });
  });

  it("handles paste of 6 digits", () => {
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "654321",
      },
    });

    expect(onChange).toHaveBeenCalledWith("654321");
  });

  it("applies aria-invalid when invalid", () => {
    render(<OtpInput value="" onChange={vi.fn()} isInvalid />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveAttribute("aria-invalid", "true");
  });
});
