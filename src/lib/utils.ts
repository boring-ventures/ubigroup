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
