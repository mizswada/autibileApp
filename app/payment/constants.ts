export const PAYMENT_METHODS = ["Online Banking", "E-Wallet", "Cash"] as const;

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  Unpaid: "#FBAB33",
  "Pending Approval": "#1C8ADB",
  Paid: "#2E7D32",
  Rejected: "#D32F2F",
};
