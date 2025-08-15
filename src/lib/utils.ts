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
