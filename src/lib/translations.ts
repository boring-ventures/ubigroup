// Utility functions for translating enum values to Spanish

export function getPropertyTypeLabel(type: string): string {
  switch (type) {
    case "HOUSE":
      return "Casa";
    case "APARTMENT":
      return "Apartamento";
    case "OFFICE":
      return "Oficina";
    case "LAND":
      return "Terreno";
    default:
      return type;
  }
}

export function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case "SALE":
      return "Venta";
    case "RENT":
      return "Alquiler";
    case "ANTICRÉTICO":
      return "Anticrético";
    default:
      return type;
  }
}

export function getPropertyStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobado";
    case "REJECTED":
      return "Rechazado";
    default:
      return status;
  }
}
