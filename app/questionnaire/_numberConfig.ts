export type NumberConfig = {
  inputType: "number";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  minLabel?: string;
  maxLabel?: string;
};

const DEFAULT_NUMBER_CONFIG: NumberConfig = {
  inputType: "number",
  min: 0,
  max: 10,
  step: 1,
  defaultValue: 0,
  minLabel: "",
  maxLabel: "",
};

export function getNumberConfig(question: any): NumberConfig | null {
  if (question?.number_config?.inputType === "number") {
    return {
      ...DEFAULT_NUMBER_CONFIG,
      ...question.number_config,
    };
  }

  if (!question?.scoring_config) {
    return null;
  }

  try {
    const parsed =
      typeof question.scoring_config === "string"
        ? JSON.parse(question.scoring_config)
        : question.scoring_config;

    if (parsed?.inputType !== "number") {
      return null;
    }

    return {
      inputType: "number",
      min: Number(parsed.min ?? DEFAULT_NUMBER_CONFIG.min),
      max: Number(parsed.max ?? DEFAULT_NUMBER_CONFIG.max),
      step: Number(parsed.step ?? DEFAULT_NUMBER_CONFIG.step),
      defaultValue: Number(
        parsed.defaultValue ?? parsed.default ?? DEFAULT_NUMBER_CONFIG.defaultValue,
      ),
      minLabel: parsed.minLabel || "",
      maxLabel: parsed.maxLabel || "",
    };
  } catch {
    return null;
  }
}

export function isNumberQuestion(
  question: any,
  numberAnswerTypeId?: number | null,
): boolean {
  if (getNumberConfig(question)) {
    return true;
  }

  if (
    numberAnswerTypeId &&
    question?.answer_type === numberAnswerTypeId
  ) {
    return true;
  }

  return false;
}

export function getNumberAnswerDefaults(
  questionsList: any[],
  numberAnswerTypeId?: number | null,
): Record<string, number> {
  const defaults: Record<string, number> = {};

  const visitQuestion = (question: any) => {
    if (!isNumberQuestion(question, numberAnswerTypeId)) {
      return;
    }

    const config = getNumberConfig(question) || DEFAULT_NUMBER_CONFIG;
    defaults[String(question.question_id)] =
      config.defaultValue ?? config.min ?? 0;
  };

  questionsList.forEach((question) => {
    visitQuestion(question);
    question.sub_questions?.forEach(visitQuestion);
    question.conditional_logic?.forEach((logic: any) => {
      logic.conditional_sub_questions?.forEach(visitQuestion);
    });
  });

  return defaults;
}

export function isNumberAnswerSet(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}
