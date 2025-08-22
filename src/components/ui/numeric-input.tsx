"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumericInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
}

export function NumericInput({
  value,
  onChange,
  placeholder = "0",
  min,
  max,
  step = 1,
  className,
  prefix,
  suffix,
  disabled = false,
  required = false,
  "aria-label": ariaLabel,
}: NumericInputProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value?.toString() || "");
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === "") {
      onChange(undefined);
      return;
    }

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let constrainedValue = numValue;
      if (min !== undefined && numValue < min) {
        constrainedValue = min;
      }
      if (max !== undefined && numValue > max) {
        constrainedValue = max;
      }
      onChange(constrainedValue);
    }
  };

  const handleIncrement = () => {
    const currentValue = value || 0;
    const newValue = currentValue + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const handleDecrement = () => {
    const currentValue = value || 0;
    const newValue = currentValue - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Select all text on focus for easy replacement
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, 100);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the value properly on blur
    if (value !== undefined) {
      setInputValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Prefix */}
      {prefix && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base sm:text-lg z-10">
          {prefix}
        </span>
      )}

      {/* Main Input */}
      <Input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        className={cn(
          "h-10 sm:h-12 text-base sm:text-lg transition-all duration-200",
          prefix && "pl-10 sm:pl-12",
          suffix && "pr-20 sm:pr-24",
          isFocused && "ring-2 ring-blue-500 ring-offset-2",
          "focus:border-blue-500 focus:ring-blue-500"
        )}
      />

      {/* Suffix */}
      {suffix && (
        <span className="absolute right-16 sm:right-20 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base sm:text-lg">
          {suffix}
        </span>
      )}

      {/* Mobile-friendly increment/decrement buttons */}
      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col h-8 sm:h-10">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && (value || 0) >= max)}
          className="h-4 sm:h-5 w-6 sm:w-8 p-0 rounded-none rounded-t-sm border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Increment"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && (value || 0) <= min)}
          className="h-4 sm:h-5 w-6 sm:w-8 p-0 rounded-none rounded-b-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Decrement"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
