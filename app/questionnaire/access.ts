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
    if (access.has_completed && !access.can_access) {
      return {
        badge: "✓ Already completed",
        alertTitle: "Screening Completed",
        alertMessage:
          access.access_reason ||
          "This screening has already been completed for this child.",
      };
    }

    if (!access.can_access) {
      const reason =
        access.access_reason || "This screening is currently unavailable.";
      let badge = "🔒 Locked";

      if (
        reason.toLowerCase().includes("age") ||
        reason.toLowerCase().includes("month")
      ) {
        badge = "🔒 Outside age range";
      } else if (reason.toLowerCase().includes("eligible")) {
        badge = "🔒 Not eligible";
      } else if (
        reason.toLowerCase().includes("admin") ||
        reason.toLowerCase().includes("unlock")
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
      alertTitle: "Autism Screening Completed",
      alertMessage:
        "This autism screening has already been completed for this patient.",
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
