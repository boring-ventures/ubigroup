import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumericInput } from "../numeric-input";

describe("NumericInput", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders with default props", () => {
    render(<NumericInput value={undefined} onChange={mockOnChange} />);

    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "number");
  });

  it("displays the provided value", () => {
    render(<NumericInput value={42} onChange={mockOnChange} />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(42);
  });

  it("calls onChange when user types a valid number", () => {
    render(<NumericInput value={undefined} onChange={mockOnChange} />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "123" } });

    expect(mockOnChange).toHaveBeenCalledWith(123);
  });

  it("calls onChange with undefined when input is empty", () => {
    render(<NumericInput value={42} onChange={mockOnChange} />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "" } });

    expect(mockOnChange).toHaveBeenCalledWith(undefined);
  });

  it("respects min constraint", () => {
    render(<NumericInput value={5} onChange={mockOnChange} min={0} />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "-5" } });

    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  it("respects max constraint", () => {
    render(<NumericInput value={5} onChange={mockOnChange} max={10} />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "15" } });

    expect(mockOnChange).toHaveBeenCalledWith(10);
  });

  it("increments value when up button is clicked", () => {
    render(<NumericInput value={5} onChange={mockOnChange} step={1} />);

    const incrementButton = screen.getByLabelText("Increment");
    fireEvent.click(incrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(6);
  });

  it("decrements value when down button is clicked", () => {
    render(<NumericInput value={5} onChange={mockOnChange} step={1} />);

    const decrementButton = screen.getByLabelText("Decrement");
    fireEvent.click(decrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it("disables increment button when at max value", () => {
    render(<NumericInput value={10} onChange={mockOnChange} max={10} />);

    const incrementButton = screen.getByLabelText("Increment");
    expect(incrementButton).toBeDisabled();
  });

  it("disables decrement button when at min value", () => {
    render(<NumericInput value={0} onChange={mockOnChange} min={0} />);

    const decrementButton = screen.getByLabelText("Decrement");
    expect(decrementButton).toBeDisabled();
  });

  it("displays prefix when provided", () => {
    render(<NumericInput value={42} onChange={mockOnChange} prefix="$" />);

    const prefix = screen.getByText("$");
    expect(prefix).toBeInTheDocument();
  });

  it("displays suffix when provided", () => {
    render(<NumericInput value={42} onChange={mockOnChange} suffix="m²" />);

    const suffix = screen.getByText("m²");
    expect(suffix).toBeInTheDocument();
  });

  it("selects all text on focus", () => {
    render(<NumericInput value={42} onChange={mockOnChange} />);

    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);

    // Note: We can't directly test text selection in JSDOM, but we can verify the focus event
    expect(input).toHaveFocus();
  });

  it("handles keyboard arrow keys", () => {
    render(<NumericInput value={5} onChange={mockOnChange} step={1} />);

    const input = screen.getByRole("spinbutton");

    // Test up arrow
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(mockOnChange).toHaveBeenCalledWith(6);

    // Test down arrow
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it("applies custom step value", () => {
    render(<NumericInput value={5} onChange={mockOnChange} step={0.5} />);

    const incrementButton = screen.getByLabelText("Increment");
    fireEvent.click(incrementButton);

    expect(mockOnChange).toHaveBeenCalledWith(5.5);
  });
});

