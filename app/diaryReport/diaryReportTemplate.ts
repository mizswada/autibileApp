import {
  DIARY_CATEGORIES,
  OPTIONAL_NOTES_LABEL,
  formatDiaryEntryLines,
  isLegacyDiaryEntry,
  type DiaryEntryData,
} from "./constants";

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

export type DiaryReportPdfEntry = DiaryEntryData & {
  timestamp: string;
};

type BuildDiaryReportHtmlOptions = {
  title: string;
  childName?: string;
  childNickname?: string;
  entries: DiaryReportPdfEntry[];
  logoUri: string | null;
  reportScope?: "all" | "date";
  selectedDate?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function formatReportDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatReportTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEntryFieldsHtml(entry: DiaryEntryData): string {
  if (isLegacyDiaryEntry(entry)) {
    return `
      <div class="entry-field full-width">
        <span class="entry-label">Report</span>
        <span class="entry-value">${escapeHtml(entry.description?.trim() || "—")}</span>
      </div>`;
  }

  const fields = DIARY_CATEGORIES.map(({ key, label }) => {
    const value = entry[key]?.trim();
    if (!value) return "";

    return `
      <div class="entry-field">
        <span class="entry-label">${escapeHtml(label)}</span>
        <span class="entry-value">${escapeHtml(value)}</span>
      </div>`;
  }).join("");

  const notes = entry.description?.trim()
    ? `
      <div class="entry-field full-width">
        <span class="entry-label">${escapeHtml(OPTIONAL_NOTES_LABEL)}</span>
        <span class="entry-value">${escapeHtml(entry.description.trim())}</span>
      </div>`
    : "";

  const combined = `${fields}${notes}`.trim();
  if (combined) return combined;

  return formatDiaryEntryLines(entry)
    .map(
      (line) => `
      <div class="entry-field full-width">
        <span class="entry-value">${escapeHtml(line)}</span>
      </div>`,
    )
    .join("");
}

function buildDateSectionsHtml(entries: DiaryReportPdfEntry[]): string {
  const grouped = entries.reduce<Record<string, DiaryReportPdfEntry[]>>(
    (acc, entry) => {
      const dateKey = new Date(entry.timestamp).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    },
    {},
  );

  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([dateKey, dayEntries]) => {
      const entriesHtml = dayEntries
        .map(
          (entry, index) => `
          <article class="entry-card">
            <div class="entry-head">
              <span class="entry-badge">Entry ${index + 1}</span>
              <span class="entry-time">${formatReportTime(entry.timestamp)}</span>
            </div>
            <div class="entry-grid">${buildEntryFieldsHtml(entry)}</div>
          </article>`,
        )
        .join("");

      return `
        <section class="date-section">
          <div class="date-title">${formatReportDate(dateKey)}</div>
          ${entriesHtml}
        </section>`;
    })
    .join("");
}

export function buildDiaryReportHtml({
  title,
  childName,
  childNickname,
  entries,
  logoUri,
  reportScope = "all",
  selectedDate,
}: BuildDiaryReportHtmlOptions): string {
  const accentColor = THEME.greenBright;
  const generatedAt = new Date();
  const childLabel = [childName, childNickname ? `(${childNickname})` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();

  const logoHtml = logoUri
    ? `<img src="${logoUri}" alt="${COMPANY.name} logo" />`
    : "";

  const metaRows = [
    { label: "Child", value: childLabel || "N/A" },
    {
      label: "Report Scope",
      value: reportScope === "date" && selectedDate
        ? formatReportDate(selectedDate)
        : "All diary entries",
    },
    { label: "Total Entries", value: String(entries.length) },
    {
      label: "Generated",
      value: generatedAt.toLocaleString("en-MY"),
    },
  ]
    .map(
      (row) => `
        <div class="meta-row">
          <span class="meta-label">${row.label}</span>
          <span class="meta-value">${escapeHtml(row.value)}</span>
        </div>`,
    )
    .join("");

  const terms = [
    "This report summarises diary observations recorded in Autibile.",
    "Please retain this document for your personal records and therapy discussions.",
    "This is a computer generated report.",
  ]
    .map((term, index) => `<li>${index + 1}. ${term}</li>`)
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
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
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 3px;
          color: ${accentColor};
          margin: 0;
          line-height: 1.1;
        }
        .doc-subtitle {
          margin-top: 6px;
          font-size: 12px;
          color: ${THEME.muted};
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
        .meta-row { display: flex; flex-direction: column; min-width: 140px; }
        .meta-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${THEME.muted};
        }
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
        .date-section { margin-bottom: 24px; page-break-inside: avoid; }
        .date-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: ${THEME.greenDark};
          text-transform: uppercase;
          padding: 8px 12px;
          background: ${THEME.greenTint};
          border-left: 4px solid ${accentColor};
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .entry-card {
          border: 1px solid ${THEME.border};
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 12px;
          background: #FBFDFB;
          page-break-inside: avoid;
        }
        .entry-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${THEME.border};
        }
        .entry-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          background: ${accentColor};
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .entry-time {
          font-size: 11px;
          color: ${THEME.muted};
          font-weight: 600;
        }
        .entry-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 18px;
        }
        .entry-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .entry-field.full-width { grid-column: 1 / -1; }
        .entry-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: ${accentColor};
          font-weight: 700;
        }
        .entry-value {
          font-size: 12.5px;
          color: ${THEME.ink};
          white-space: pre-wrap;
        }
        .terms { margin-top: 28px; border-top: 1px solid ${THEME.border}; padding-top: 14px; }
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
            <p class="doc-type">DIARY REPORT</p>
            <p class="doc-subtitle">${escapeHtml(title)}</p>
            <span class="status-badge">Patient Record</span>
          </div>
        </div>

        <div class="accent-bar"></div>

        <div class="meta-strip">${metaRows}</div>

        ${
          childLabel
            ? `
        <div class="party">
          <div class="party-title">Prepared For</div>
          <div class="party-name">${escapeHtml(childLabel)}</div>
        </div>`
            : ""
        }

        ${buildDateSectionsHtml(entries)}

        <div class="terms">
          <div class="terms-title">Notes</div>
          <ul>${terms}</ul>
        </div>

        <div class="footer">
          <p>Generated by <strong>${COMPANY.name}</strong> via Autibile.</p>
          <p>Generated on ${generatedAt.toLocaleDateString("en-MY")} &middot; This is a computer generated document.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildDiaryReportFilename(
  childName?: string,
  forAllEntries = true,
  selectedDate?: string | null,
): string {
  const safeChild = (childName || "Child")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
  const stamp = new Date().toISOString().slice(0, 10);

  if (!forAllEntries && selectedDate) {
    const safeDate = selectedDate.replace(/\s/g, "_");
    return `Diary_Report_${safeChild}_${safeDate}.pdf`;
  }

  return `Diary_Report_${safeChild}_${stamp}.pdf`;
}
