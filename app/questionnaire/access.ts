export type QuestionnaireAccess = {
  can_access?: boolean;
  has_completed?: boolean;
  has_completed_mchatr?: boolean;
  access_reason?: string;
};

export function getQuestionnaireLockInfo(
  questionnaireId: number,
  access?: QuestionnaireAccess | null,
) {
  if (access) {
    if (access.has_completed) {
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

      if (questionnaireId !== 1 && access.has_completed_mchatr === false) {
        badge = "🔒 Complete M-CHAT-R first";
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
    alertMessage:
      "This screening is currently unavailable. Complete M-CHAT-R first or contact admin.",
  };
}
