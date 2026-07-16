export const PAYMENT_METHODS = ["Online Banking", "E-Wallet", "Cash"] as const;

export const INVOICE_FILTERS = ["All", "Unpaid", "Pending Approval", "Paid", "Rejected"] as const;

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  Unpaid: "#FBAB33",
  "Pending Approval": "#4db5ff",
  Paid: "#2E7D32",
  Rejected: "#D32F2F",
};

export function formatInvoiceId(id: number | string) {
  return `INV-${String(id).padStart(3, "0")}`;
}

export function formatPaymentId(id: number | string) {
  return `PAY-${String(id).padStart(3, "0")}`;
}

export function formatPrice(amount: number | string | null | undefined) {
  return Number(amount || 0).toFixed(2);
}

export function formatDate(dateString?: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}