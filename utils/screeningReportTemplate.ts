import { formatAppDateFromDate } from "@/utils/formatLocalDate";

const THEME = {
  green: "#2E7D32",
  greenDark: "#1B5E20",
  greenBright: "#43A047",
  greenTint: "#E8F5E9",
  ink: "#1F2937",
  muted: "#6B7280",
  border: "#D9E5DB",
  highlight: "#B45309",
};

const COMPANY = {
  name: "NeuroSpa Therapy",
  addressLines: [
    "1 - 4, Prima Bizwalk Business Park",
    "Jalan Tasik Prima 6/2, Taman Tasik Prima",
    "47150 Puchong, Selangor.",
  ],
};

export type ScreeningSummaryRow = {
  domain: string;
  score: string;
  interpretation: string;
};

export type IndividualScreeningResultData = {
  logoUri: string | null;
  questionnaireTitle: string;
  childName: string;
  patientId?: string | number;
  score: number;
  interpretation?: string;
  interpretation_bm?: string;
  recommendation?: string;
  recommendation_bm?: string;
  aiAnalysis?: { explanation?: string; result?: string } | null;
  showMchatFollowUp?: boolean;
};

export type IntegratedScreeningReportData = {
  logoUri: string | null;
  childName: string;
  childDOB: string;
  childAge: string;
  childGender: string;
  screeningDate: string;
  parentName: string;
  parentRelationship: string;
  summaryRows: ScreeningSummaryRow[];
  detailedSectionsHtml: string;
};

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function buildDocumentStyles(): string {
  return `
    * { box-sizing: border-box; }
    @page { margin: 16mm; size: A4; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: ${THEME.ink};
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc { max-width: 780px; margin: 0 auto; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand img { height: 60px; width: auto; }
    .company-name { font-size: 20px; font-weight: 700; color: ${THEME.greenDark}; margin: 0; }
    .company-address { font-size: 11px; color: ${THEME.muted}; margin-top: 4px; }
    .doc-head { text-align: right; }
    .doc-type {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
      color: ${THEME.greenBright};
      margin: 0;
      line-height: 1.1;
    }
    .doc-subtitle { margin-top: 6px; font-size: 12px; color: ${THEME.muted}; }
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
    .section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: ${THEME.greenBright};
      text-transform: uppercase;
      margin: 0 0 10px 0;
    }
    .info-panel {
      border: 1px solid ${THEME.border};
      border-left: 4px solid ${THEME.greenBright};
      border-radius: 8px;
      padding: 14px 18px;
      background: #FBFDFB;
      margin-bottom: 18px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
    }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: ${THEME.muted};
      font-weight: 700;
    }
    .info-value { font-size: 12.5px; font-weight: 600; color: ${THEME.ink}; }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 11.5px;
    }
    .summary-table thead th {
      background: ${THEME.greenBright};
      color: #fff;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 10px 12px;
    }
    .summary-table tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid ${THEME.border};
      vertical-align: top;
    }
    .summary-table tbody tr:nth-child(even) { background: ${THEME.greenTint}; }
    .domain-section {
      margin: 0 0 12px 0;
      padding: 12px 14px;
      background: #FBFDFB;
      border: 1px solid ${THEME.border};
      border-left: 4px solid ${THEME.greenBright};
      border-radius: 8px;
    }
    .domain-section h3 {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: ${THEME.greenDark};
      font-weight: 700;
    }
    .domain-section ul { margin: 0; padding-left: 18px; }
    .domain-section li { margin: 4px 0; font-size: 11.5px; }
    .domain-section p { margin: 0; font-size: 11.5px; color: ${THEME.muted}; }
    .highlight { font-weight: 700; color: ${THEME.highlight}; }
    .score-panel {
      text-align: center;
      background: ${THEME.greenTint};
      border: 1px solid ${THEME.border};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .score-label { font-size: 12px; color: ${THEME.muted}; margin: 0; }
    .score-number {
      font-size: 34px;
      font-weight: 800;
      color: ${THEME.greenDark};
      margin: 6px 0 0 0;
    }
    .content-panel {
      border: 1px solid ${THEME.border};
      border-left: 4px solid ${THEME.greenBright};
      border-radius: 8px;
      padding: 14px 16px;
      background: #fff;
      margin-bottom: 14px;
    }
    .content-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: ${THEME.greenBright};
      margin-bottom: 8px;
    }
    .content-text { font-size: 12px; color: ${THEME.ink}; margin: 0 0 6px 0; line-height: 1.5; }
    .content-text-muted { font-size: 12px; color: ${THEME.muted}; font-style: italic; }
    .divider { height: 1px; background: ${THEME.border}; margin: 10px 0; }
    .ai-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: ${THEME.muted};
      margin-bottom: 4px;
    }
    .next-steps {
      background: ${THEME.greenTint};
      border: 1px solid ${THEME.border};
      border-left: 4px solid ${THEME.greenDark};
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
      font-size: 12px;
      color: ${THEME.greenDark};
    }
    .notes-panel {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-left: 4px solid #F59E0B;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 18px 0;
    }
    .notes-panel h4 {
      margin: 0 0 8px 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: #92400E;
    }
    .notes-panel ul { margin: 0; padding-left: 18px; }
    .notes-panel li { margin: 4px 0; font-size: 11px; color: #92400E; }
    .assessor-panel {
      border: 1px solid ${THEME.border};
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 18px;
    }
    .assessor-panel h4 {
      margin: 0 0 10px 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: ${THEME.greenBright};
    }
    .assessor-line {
      margin: 8px 0;
      font-size: 11.5px;
      color: ${THEME.ink};
    }
    .signature-line {
      display: inline-block;
      min-width: 160px;
      border-bottom: 1px solid ${THEME.ink};
      margin-left: 6px;
    }
    .terms {
      margin-top: 24px;
      border-top: 1px solid ${THEME.border};
      padding-top: 14px;
    }
    .terms-title {
      font-size: 11px;
      font-weight: 700;
      color: ${THEME.greenBright};
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
      border-top: 2px solid ${THEME.greenBright};
      font-size: 11px;
      color: ${THEME.muted};
    }
    .footer strong { color: ${THEME.greenDark}; }
  `;
}

function buildHeaderHtml(
  docType: string,
  subtitle: string,
  badgeText: string,
  logoUri: string | null,
): string {
  const logoHtml = logoUri
    ? `<img src="${logoUri}" alt="${COMPANY.name} logo" />`
    : "";

  return `
    <div class="top">
      <div class="brand">
        ${logoHtml}
        <div>
          <p class="company-name">${COMPANY.name}</p>
          <div class="company-address">${COMPANY.addressLines.join("<br>")}</div>
        </div>
      </div>
      <div class="doc-head">
        <p class="doc-type">${escapeHtml(docType)}</p>
        <p class="doc-subtitle">${escapeHtml(subtitle)}</p>
        <span class="status-badge">${escapeHtml(badgeText)}</span>
      </div>
    </div>
    <div class="accent-bar"></div>
  `;
}

function buildMetaStripHtml(rows: { label: string; value: string }[]): string {
  return `
    <div class="meta-strip">
      ${rows
        .map(
          (row) => `
        <div class="meta-row">
          <span class="meta-label">${escapeHtml(row.label)}</span>
          <span class="meta-value">${escapeHtml(row.value)}</span>
        </div>`,
        )
        .join("")}
    </div>`;
}

function buildNotesHtml(): string {
  return `
    <div class="notes-panel">
      <h4>Important Notes</h4>
      <ul>
        <li>This screening is not a diagnosis</li>
        <li>Further clinical evaluation may be required</li>
        <li>Early intervention improves outcomes</li>
      </ul>
    </div>`;
}

function buildFooterHtml(): string {
  const generatedOn = formatAppDateFromDate(new Date());
  return `
    <div class="footer">
      <p>This report is confidential and intended for the parent/guardian and authorized healthcare providers only.</p>
      <p>Generated by <strong>${COMPANY.name}</strong> via Autibile on ${generatedOn}.</p>
    </div>`;
}

export function buildMchatDetailedHtml(mchatScore: string | number): string {
  const score =
    typeof mchatScore === "number" ? mchatScore : parseInt(String(mchatScore), 10);
  let items = "";

  if (Number.isNaN(score)) {
    items = "<li>Score not available.</li>";
  } else if (score <= 2) {
    items =
      '<li><span class="highlight">LOW RISK.</span> If child is under 2 years old, repeat after 2 years old. No further action is required unless surveillance indicates likelihood for autism.</li>';
  } else if (score >= 3 && score <= 7) {
    items =
      '<li><span class="highlight">MODERATE RISK.</span> Please arrange a face-to-face consultation to continue with the M-CHAT-R Follow-Up Interview.</li>';
  } else if (score >= 8) {
    items =
      '<li><span class="highlight">HIGH RISK.</span> Proceed to diagnostic evaluation. Highly recommended for early intervention.</li>';
  }

  return `
    <div class="domain-section">
      <h3>Screening (M-CHAT-R) [Score: ${escapeHtml(String(mchatScore))} / 20]</h3>
      <ul>${items}</ul>
    </div>`;
}

export function buildBambiDetailedHtml(bambiScore: string | number): string {
  if (bambiScore === "N/A") {
    return `
      <div class="domain-section">
        <h3>Feeding (BAMBI) [Not assessed]</h3>
        <p>Not assessed — no screening completed</p>
      </div>`;
  }

  const score =
    typeof bambiScore === "number" ? bambiScore : parseInt(String(bambiScore), 10);
  const riskText =
    !Number.isNaN(score) && score <= 34
      ? '<span class="highlight">Within typical limits.</span>'
      : '<span class="highlight">Feeding concerns.</span>';

  return `
    <div class="domain-section">
      <h3>Feeding (BAMBI) [Score: ${escapeHtml(String(bambiScore))}]</h3>
      <ul>
        <li>${riskText}</li>
        <li>Recommendation: Refer if clinically indicated.</li>
      </ul>
    </div>`;
}

export function buildSleepDetailedHtml(sleepScore: string | number): string {
  if (sleepScore === "N/A") {
    return `
      <div class="domain-section">
        <h3>Sleep (CSHQ-SF) [Not assessed]</h3>
        <p>Not assessed — no screening completed</p>
      </div>`;
  }

  const score =
    typeof sleepScore === "number" ? sleepScore : parseInt(String(sleepScore), 10);
  const riskText =
    !Number.isNaN(score) && score >= 30
      ? '<span class="highlight">Risk for sleep problems.</span>'
      : '<span class="highlight">Low risk.</span>';

  return `
    <div class="domain-section">
      <h3>Sleep (CSHQ-SF) [Score: ${escapeHtml(String(sleepScore))}]</h3>
      <ul>
        <li>${riskText}</li>
        <li>Recommendation: Maintain sleep hygiene or assess.</li>
      </ul>
    </div>`;
}

export function buildScreenDetailedHtml(
  screenScore: string | number,
  screenInterpretation: string,
  screenRecommendation: string,
): string {
  if (screenScore === "N/A") {
    return `
      <div class="domain-section">
        <h3>Screen Time (SEQ) [Not assessed]</h3>
        <p>Not assessed — no screening completed</p>
      </div>`;
  }

  let items = "";
  if (screenInterpretation && screenInterpretation !== "Not assessed") {
    items += `<li><span class="highlight">${escapeHtml(screenInterpretation)}</span></li>`;
  } else {
    items += "<li>Score recorded.</li>";
  }
  if (screenRecommendation) {
    items += `<li>Recommendation: ${escapeHtml(screenRecommendation)}</li>`;
  }

  return `
    <div class="domain-section">
      <h3>Screen Time (SEQ) [Score: ${escapeHtml(String(screenScore))}]</h3>
      <ul>${items}</ul>
    </div>`;
}

export function buildIntegratedScreeningReportHtml(
  data: IntegratedScreeningReportData,
): string {
  const generatedAt = new Date().toLocaleString("en-MY");
  const summaryRowsHtml = data.summaryRows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.domain)}</td>
        <td>${escapeHtml(row.score)}</td>
        <td>${escapeHtml(row.interpretation)}</td>
      </tr>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Integrated Developmental Screening Report</title>
      <style>${buildDocumentStyles()}</style>
    </head>
    <body>
      <div class="doc">
        ${buildHeaderHtml(
          "SCREENING REPORT",
          "Integrated Developmental Screening Report",
          "Multi-Domain",
          data.logoUri,
        )}
        ${buildMetaStripHtml([
          { label: "Report Generated", value: generatedAt },
          { label: "Report Type", value: "Integrated Developmental Screening" },
          { label: "Screening Date", value: data.screeningDate },
        ])}

        <div class="info-panel">
          <div class="section-title">Child Information</div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Child's Name</span><span class="info-value">${escapeHtml(data.childName)}</span></div>
            <div class="info-item"><span class="info-label">Age at Screening</span><span class="info-value">${escapeHtml(data.childAge)}</span></div>
            <div class="info-item"><span class="info-label">Date of Birth</span><span class="info-value">${escapeHtml(data.childDOB)}</span></div>
            <div class="info-item"><span class="info-label">Gender</span><span class="info-value">${escapeHtml(data.childGender)}</span></div>
          </div>
        </div>

        <div class="info-panel">
          <div class="section-title">Parent / Caregiver Information</div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Name</span><span class="info-value">${escapeHtml(data.parentName)}</span></div>
            <div class="info-item"><span class="info-label">Relationship to Child</span><span class="info-value">${escapeHtml(data.parentRelationship)}</span></div>
          </div>
        </div>

        <div class="section-title">Summary Table</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Score</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>${summaryRowsHtml}</tbody>
        </table>

        <div class="section-title">Detailed Scoring Breakdowns</div>
        ${data.detailedSectionsHtml}

        ${buildNotesHtml()}

        <div class="assessor-panel">
          <h4>Assessor's Information</h4>
          <p class="assessor-line"><strong>Name:</strong><span class="signature-line"></span></p>
          <p class="assessor-line"><strong>Designation:</strong><span class="signature-line"></span></p>
          <p class="assessor-line"><strong>Institution:</strong><span class="signature-line"></span></p>
          <p class="assessor-line"><strong>Signature:</strong><span class="signature-line"></span></p>
          <p class="assessor-line"><strong>Date:</strong><span class="signature-line"></span></p>
        </div>

        ${buildFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

export function buildIndividualScreeningResultHtml(
  data: IndividualScreeningResultData,
): string {
  const generatedAt = new Date().toLocaleString("en-MY");

  const interpretationHtml =
    data.interpretation && data.interpretation !== "No prediction available"
      ? `<p class="content-text"><strong>Based on Score (${escapeHtml(String(data.score))}):</strong> ${escapeHtml(data.interpretation)}</p>`
      : "";
  const interpretationBmHtml = data.interpretation_bm
    ? `<p class="content-text-muted">${escapeHtml(data.interpretation_bm)}</p>`
    : "";
  const aiExplanationHtml = data.aiAnalysis?.explanation
    ? `<div class="divider"></div><div class="ai-label">AI Analysis</div><p class="content-text">${escapeHtml(data.aiAnalysis.explanation)}</p>`
    : "";

  const recommendationHtml =
    data.recommendation && data.recommendation !== "No recommendation available"
      ? `<p class="content-text">${escapeHtml(data.recommendation)}</p>`
      : "";
  const recommendationBmHtml = data.recommendation_bm
    ? `<p class="content-text-muted">${escapeHtml(data.recommendation_bm)}</p>`
    : "";
  const aiRecommendationHtml = data.aiAnalysis?.result
    ? `<div class="divider"></div><div class="ai-label">AI Recommendation</div><p class="content-text">${escapeHtml(data.aiAnalysis.result)}</p>`
    : "";

  const followUpHtml = data.showMchatFollowUp
    ? `<div class="next-steps"><strong>Next Steps:</strong> Based on your score, the patient needs to take the next level questionnaire (M-CHAT-R/F). Please contact our administrator for the next process.</div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.questionnaireTitle)} Screening Result</title>
      <style>${buildDocumentStyles()}</style>
    </head>
    <body>
      <div class="doc">
        ${buildHeaderHtml(
          "SCREENING RESULT",
          `${data.questionnaireTitle} Assessment`,
          "Individual Report",
          data.logoUri,
        )}
        ${buildMetaStripHtml([
          { label: "Report Generated", value: generatedAt },
          { label: "Assessment", value: data.questionnaireTitle },
          { label: "Patient ID", value: String(data.patientId ?? "N/A") },
        ])}

        <div class="info-panel">
          <div class="section-title">Child Information</div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Child's Name</span><span class="info-value">${escapeHtml(data.childName)}</span></div>
            <div class="info-item"><span class="info-label">Patient ID</span><span class="info-value">${escapeHtml(String(data.patientId ?? "N/A"))}</span></div>
          </div>
        </div>

        <div class="score-panel">
          <p class="score-label">Total Score</p>
          <p class="score-number">${escapeHtml(String(data.score))}</p>
        </div>

        <div class="content-panel">
          <div class="content-label">Prediction</div>
          ${interpretationHtml}
          ${interpretationBmHtml}
          ${aiExplanationHtml}
        </div>

        <div class="content-panel">
          <div class="content-label">Recommendation</div>
          ${recommendationHtml}
          ${recommendationBmHtml}
          ${aiRecommendationHtml}
        </div>

        ${followUpHtml}
        ${buildNotesHtml()}
        ${buildFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

export function buildIntegratedReportFilename(childName: string): string {
  const safeChild = childName.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_");
  return `Integrated_Screening_${safeChild}_${new Date().toISOString().slice(0, 10)}.pdf`;
}

export function buildIndividualResultFilename(
  questionnaireTitle: string,
  childName: string,
): string {
  const safeTitle = questionnaireTitle.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_");
  const safeChild = childName.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_");
  return `${safeTitle}_Result_${safeChild}_${new Date().toISOString().slice(0, 10)}.pdf`;
}
