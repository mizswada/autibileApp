import { formatDate, formatInvoiceId, formatPaymentId, formatPrice } from "./constants";
import { formatAppDateFromDate } from "@/utils/formatLocalDate";

// Theme colours derived from the NeuroSpa Therapy logo.
// Kept in sync with the website receipt (pages/payment/history.vue).
const THEME = {
  green: "#2E7D32",
  greenDark: "#1B5E20",
  greenBright: "#43A047",
  greenTint: "#E8F5E9",
  ink: "#1F2937",
  muted: "#6B7280",
  border: "#D9E5DB",
};

const COMPANY = {
  name: "NeuroSpa Therapy",
  addressLines: [
    "1 - 4, Prima Bizwalk Business Park",
    "Jalan Tasik Prima 6/2, Taman Tasik Prima",
    "47150 Puchong, Selangor.",
  ],
};

/**
 * Builds the receipt HTML for expo-print. The layout, colours and structure
 * intentionally match the website receipt so both channels look identical.
 */
export function buildReceiptHtml(payment: any, logoUri: string | null): string {
  const accentColor = THEME.greenBright;
  const patientName = payment.user_patients?.fullname || "N/A";
  const description = payment.invoice?.description || "N/A";
  const invoiceType = payment.invoice?.invoice_type;

  const logoHtml = logoUri
    ? `<img src="${logoUri}" alt="${COMPANY.name} logo" />`
    : "";

  const partyLines = [
    payment.patient_id ? `Patient ID: ${payment.patient_id}` : "",
    invoiceType ? `Invoice Type: ${invoiceType}` : "",
  ]
    .filter(Boolean)
    .map((line) => `<div class="party-line">${line}</div>`)
    .join("");

  const metaRows = [
    { label: "Receipt No", value: formatPaymentId(payment.payment_id) },
    { label: "Invoice No", value: formatInvoiceId(payment.invoice_id) },
    { label: "Payment Date", value: formatDate(payment.created_at) },
    { label: "Issued Date", value: formatAppDateFromDate(new Date()) },
  ]
    .map(
      (row) => `
        <div class="meta-row">
          <span class="meta-label">${row.label}</span>
          <span class="meta-value">${row.value}</span>
        </div>`,
    )
    .join("");

  const summaryRows = [
    { label: "Sub Total", value: `RM ${formatPrice(payment.amount)}` },
    { label: "Tax (0%)", value: "RM 0.00" },
    { label: `Paid (${payment.method || "N/A"})`, value: `RM ${formatPrice(payment.amount)}` },
  ]
    .map(
      (row) => `
        <div class="summary-row">
          <span>${row.label}</span>
          <span>${row.value}</span>
        </div>`,
    )
    .join("");

  const paymentInfo = [
    { label: "Payment Date", value: formatDate(payment.created_at) },
    { label: "Payment Method", value: payment.method || "N/A" },
  ];
  if (payment.bank_name) {
    paymentInfo.push({ label: "Bank / Provider", value: payment.bank_name });
  }
  if (payment.reference_code) {
    paymentInfo.push({ label: "Reference Code", value: payment.reference_code });
  }
  const paymentInfoHtml = paymentInfo
    .map(
      (row) => `
      <div class="info-item">
        <span class="info-label">${row.label}</span>
        <span class="info-value">${row.value}</span>
      </div>`,
    )
    .join("");

  const terms = [
    "This receipt confirms that payment has been received in full.",
    "Please retain this receipt for your records.",
    "This is a computer generated receipt.",
  ]
    .map((term, i) => `<li>${i + 1}. ${term}</li>`)
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt ${formatPaymentId(payment.payment_id)}</title>
      <style>
        * { box-sizing: border-box; }
        @page { margin: 16px; size: A4; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: ${THEME.ink};
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .doc { max-width: 780px; margin: 0 auto; }
        .top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        .brand { display: flex; align-items: center; gap: 14px; }
        .brand img { height: 60px; width: auto; }
        .company-name { font-size: 20px; font-weight: 700; color: ${THEME.greenDark}; margin: 0; }
        .company-address { font-size: 11px; color: ${THEME.muted}; margin-top: 4px; }
        .doc-head { text-align: right; }
        .doc-type {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 4px;
          color: ${accentColor};
          margin: 0;
          line-height: 1;
        }
        .status-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #fff;
          background: ${THEME.green};
        }
        .accent-bar {
          height: 4px;
          background: linear-gradient(90deg, ${THEME.greenDark}, ${THEME.greenBright});
          border-radius: 2px;
          margin: 16px 0 20px;
        }
        .meta-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 40px;
          background: ${THEME.greenTint};
          border: 1px solid ${THEME.border};
          border-radius: 8px;
          padding: 12px 18px;
          margin-bottom: 22px;
        }
        .meta-row { display: flex; flex-direction: column; }
        .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: ${THEME.muted}; }
        .meta-value { font-size: 13px; font-weight: 600; color: ${THEME.ink}; }
        .party { margin-bottom: 18px; }
        .party-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          color: ${accentColor};
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .party-name { font-size: 15px; font-weight: 700; }
        .party-line { font-size: 12px; color: ${THEME.muted}; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        thead th {
          background: ${accentColor};
          color: #fff;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
          padding: 10px 12px;
        }
        thead th.num, tbody td.num { text-align: right; }
        tbody td { padding: 12px; border-bottom: 1px solid ${THEME.border}; font-size: 12.5px; vertical-align: top; }
        .totals { display: flex; justify-content: flex-end; }
        .summary-box { width: 280px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 13px; color: ${THEME.muted}; }
        .summary-row.grand {
          background: ${THEME.greenTint};
          border: 1px solid ${THEME.border};
          border-radius: 8px;
          margin-top: 6px;
          padding: 12px;
          font-size: 15px;
          font-weight: 700;
          color: ${THEME.greenDark};
        }
        .info-panel {
          margin-top: 24px;
          border: 1px solid ${THEME.border};
          border-left: 4px solid ${accentColor};
          border-radius: 8px;
          padding: 14px 18px;
          background: #FBFDFB;
        }
        .info-panel-title {
          font-size: 12px;
          font-weight: 700;
          color: ${accentColor};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
        .info-item { display: flex; flex-direction: column; }
        .info-label { font-size: 10px; text-transform: uppercase; color: ${THEME.muted}; letter-spacing: 0.5px; }
        .info-value { font-size: 12.5px; font-weight: 600; }
        .sign-remark { display: flex; justify-content: space-between; gap: 40px; margin-top: 48px; }
        .sign-block, .remark-block { flex: 1; }
        .sign-line {
          margin-top: 42px;
          border-top: 1.5px solid ${THEME.ink};
          padding-top: 6px;
          font-size: 12px;
          font-weight: 600;
          color: ${THEME.ink};
        }
        .remark-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: ${accentColor};
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .remark-box {
          min-height: 60px;
          border: 1px solid ${THEME.border};
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: ${THEME.muted};
        }
        .terms { margin-top: 34px; border-top: 1px solid ${THEME.border}; padding-top: 14px; }
        .terms-title {
          font-size: 11px;
          font-weight: 700;
          color: ${accentColor};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .terms ul { margin: 0; padding: 0; list-style: none; }
        .terms li { font-size: 10.5px; color: ${THEME.muted}; margin: 2px 0; }
        .footer {
          text-align: center;
          margin-top: 22px;
          padding-top: 12px;
          border-top: 2px solid ${accentColor};
          font-size: 11px;
          color: ${THEME.muted};
        }
        .footer strong { color: ${THEME.greenDark}; }
      </style>
    </head>
    <body>
      <div class="doc">
        <div class="top">
          <div class="brand">
            ${logoHtml}
            <div>
              <p class="company-name">${COMPANY.name}</p>
              <div class="company-address">${COMPANY.addressLines.join("<br>")}</div>
            </div>
          </div>
          <div class="doc-head">
            <p class="doc-type">RECEIPT</p>
            <span class="status-badge">Paid</span>
          </div>
        </div>

        <div class="accent-bar"></div>

        <div class="meta-strip">${metaRows}</div>

        <div class="party">
          <div class="party-title">PAID BY</div>
          <div class="party-name">${patientName}</div>
          ${partyLines}
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="num">Price</th>
              <th class="num">Discount</th>
              <th class="num">Qty</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${description}</td>
              <td class="num">RM ${formatPrice(payment.amount)}</td>
              <td class="num">RM 0.00</td>
              <td class="num">1</td>
              <td class="num">RM ${formatPrice(payment.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="summary-box">
            ${summaryRows}
            <div class="summary-row grand">
              <span>Grand Total</span>
              <span>RM ${formatPrice(payment.amount)}</span>
            </div>
          </div>
        </div>

        <div class="info-panel">
          <div class="info-panel-title">Payment Information</div>
          <div class="info-grid">${paymentInfoHtml}</div>
        </div>

        <div class="sign-remark">
          <div class="sign-block">
            <div class="sign-line">Authorised Signature</div>
          </div>
          <div class="remark-block">
            <div class="remark-title">Remark</div>
            <div class="remark-box">Payment received with thanks. No signature required.</div>
          </div>
        </div>

        <div class="terms">
          <div class="terms-title">Terms &amp; Conditions</div>
          <ul>${terms}</ul>
        </div>

        <div class="footer">
          <p>Thank you for choosing <strong>${COMPANY.name}</strong>.</p>
          <p>Generated on ${formatAppDateFromDate(new Date())} &middot; This is a computer generated document.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
