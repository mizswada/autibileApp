export type QuestionnaireAccess = {
  can_access?: boolean;
  has_completed?: boolean;
  has_completed_mchatr?: boolean;
  access_reason?: string;
  show_age_warning?: boolean;
  age_warning_message?: string | null;
  age_in_range?: boolean | null;
  age_range_label?: string | null;
  age_label?: string | null;
};

export function getQuestionnaireLockInfo(
  questionnaireId: number,
  access?: QuestionnaireAccess | null,
) {
  if (access) {
    if (!access.can_access) {
      const reason =
        access.access_reason || "This screening is currently unavailable.";
      const lowerReason = reason.toLowerCase();

      // Completion lock takes precedence — e.g. after submit, access is disabled
      // but age_in_range may still be false for warning-only questionnaires.
      if (access.has_completed) {
        const completedMessage =
          lowerReason.includes("age") ||
          lowerReason.includes("month") ||
          reason === "Questionnaire is locked. Contact admin to unlock." ||
          reason === "This screening is currently unavailable."
            ? "This screening has already been completed for this child."
            : reason;

        return {
          badge: "✓ Already completed",
          alertTitle: "Screening Completed",
          alertMessage: completedMessage,
        };
      }

      // Age hard-lock applies to M-CHAT-R (and when the server reason says so).
      const isAgeLock =
        questionnaireId === 1
          ? access.age_in_range === false ||
            lowerReason.includes("age") ||
            lowerReason.includes("month")
          : lowerReason.includes("age") || lowerReason.includes("month");

      if (isAgeLock) {
        return {
          badge: "🔒 Outside age range",
          alertTitle: "Screening Locked",
          alertMessage:
            reason !== "This screening is currently unavailable."
              ? reason
              : `This child is outside the recommended age range${
                  access.age_range_label ? ` (${access.age_range_label})` : ""
                } for this screening.`,
        };
      }

      let badge = "🔒 Locked";

      if (lowerReason.includes("eligible")) {
        badge = "🔒 Not eligible";
      } else if (
        lowerReason.includes("admin") ||
        lowerReason.includes("unlock")
      ) {
        badge = "🔒 Contact admin";
      }

      return {
        badge,
        alertTitle: "Screening Locked",
        alertMessage: reason,
      };
    }
  }

  if (questionnaireId === 1) {
    return {
      badge: "✓ Already completed",
      alertTitle: "Screening Completed",
      alertMessage:
        "This screening has already been completed for this patient.",
    };
  }

  return {
    badge: "🔒 Unavailable",
    alertTitle: "Screening Locked",
    alertMessage: "This screening is currently unavailable. Contact admin.",
  };
}

export function getAgeWarningInfo(access?: QuestionnaireAccess | null) {
  if (!access?.show_age_warning) return null;

  return {
    title: "Age Range Notice",
    message:
      access.age_warning_message ||
      "This child is outside the recommended age range for this screening. You may still continue.",
  };
}
