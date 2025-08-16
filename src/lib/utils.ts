import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { TransactionType } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a custom property ID based on transaction type
 * ANT → Anticrético
 * VEN → Sale (Venta)
 * ALQ → Rent (Alquiler)
 */
export function generateCustomPropertyId(
  transactionType: TransactionType
): string {
  const prefix = {
    [TransactionType.ANTICRÉTICO]: "ANT",
    [TransactionType.SALE]: "VEN",
    [TransactionType.RENT]: "ALQ",
  }[transactionType];

  if (!prefix) {
    throw new Error(`Invalid transaction type: ${transactionType}`);
  }

  // For now, we'll use a timestamp-based approach
  // In a real implementation, you'd want to query the database for the last ID
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
}

/**
 * Gets the pin color for a property based on transaction type
 */
export function getPropertyPinColor(transactionType: TransactionType): string {
  switch (transactionType) {
    case TransactionType.RENT:
      return "#FFD700"; // Yellow
    case TransactionType.ANTICRÉTICO:
      return "#0066CC"; // Blue
    case TransactionType.SALE:
      return "#00CC00"; // Green
    default:
      return "#FF0000"; // Red (fallback)
  }
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that need quotes (contain commas, quotes, or newlines)
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"') || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generates a secure random password
 * @param length - Length of the password (default: 12)
 * @returns A secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  };

  // Ensure at least one character from each category
  let password = "";
  password +=
    charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
  password +=
    charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
  password +=
    charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
  password +=
    charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

  // Fill the rest with random characters from all categories
  const allChars =
    charset.uppercase + charset.lowercase + charset.numbers + charset.symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to make it more random
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Formats a phone number with Bolivia country code if not already formatted
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If it already starts with +591, return as is
  if (phone.startsWith("+591")) return phone;

  // If it starts with 591, add the +
  if (digits.startsWith("591")) return `+${digits}`;

  // If it's a 9-digit number (Bolivia mobile), add +591
  if (digits.length === 9) return `+591${digits}`;

  // If it's a 8-digit number (Bolivia landline), add +591
  if (digits.length === 8) return `+591${digits}`;

  // If it's already 11 digits and starts with 591, add +
  if (digits.length === 11 && digits.startsWith("591")) return `+${digits}`;

  // Default: return as is
  return phone;
}

/**
 * Removes the +591 prefix from a phone number for display in the input field
 * @param phone - The phone number with prefix
 * @returns Phone number without prefix
 */
export function removePhonePrefix(phone: string): string {
  if (!phone) return "";

  // If it starts with +591, remove it
  if (phone.startsWith("+591")) {
    return phone.substring(4);
  }

  // If it starts with 591, remove it
  if (phone.startsWith("591")) {
    return phone.substring(3);
  }

  // Return as is if no prefix
  return phone;
}
