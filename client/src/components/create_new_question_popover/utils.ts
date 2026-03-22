import type { Difficulty, QuestionKind } from "@/types/questions";
import type { CreateNewQuestionStoreState } from "./store";

export function getChoicesBasedOnQuestionType(
  questionType: QuestionKind,
  state: CreateNewQuestionStoreState,
) {
  switch (questionType) {
    case "multiple_choice_questions":
      return state.mcq.choices;
    case "true_false":
      return ["True", "False"];
    case "short_question":
      return [];
    case "fill_in_the_blanks":
      return state.fillInTheBlanks.correctAnswers;
    default:
      return [];
  }
}

export function getCorrectAnswerIndexBasedOnQuestionType(
  questionType: QuestionKind,
  state: CreateNewQuestionStoreState,
): number {
  switch (questionType) {
    case "multiple_choice_questions":
      return state.mcq.correctAnswer;
    case "true_false":
      return state.trueFalse.correctAnswer ? 0 : 1;
    default:
      return 0;
  }
}

export function getCorrectAnswerTextBasedOnQuestionType(
  questionType: QuestionKind,
  state: CreateNewQuestionStoreState,
) {
  switch (questionType) {
    case "multiple_choice_questions":
      return state.mcq.choices[state.mcq.correctAnswer];
    case "true_false":
      return state.trueFalse.correctAnswer ? "True" : "False";
    case "short_question":
      return state.shortAnswer.estimatedCorrectAnswer;
    case "fill_in_the_blanks":
      return state.fillInTheBlanks.correctAnswers.join(",");
    default:
      return "";
  }
}

export function validateInputs(
  questionType: QuestionKind,
  questionText: string,
  choices: string[],
  correctAnswer: string,
) {
  let error = "";
  if (!questionText || questionText.trim() === "") {
    error = "Question text cannot be empty";
  }
  if (questionType === "multiple_choice_questions") {
    if (choices.length < 4 || choices.some((c) => c.trim() === "")) {
      error = "All 4 choices must be filled out";
    }
    if (!correctAnswer || correctAnswer.trim() === "") {
      error = "A correct answer must be selected";
    }
  }
  if (questionType === "true_false") {
    if (!correctAnswer || correctAnswer.trim() === "") {
      error = "A correct answer must be selected";
    }
  }
  if (questionType === "fill_in_the_blanks" && choices.length === 0) {
    error = "At least one correct answer must be added";
  }
  return { error, isError: error !== "" };
}

interface CreateQuestionVariables {
  set_id: string;
  difficulty: Difficulty;
  questionType: QuestionKind;
  questionText: string;
  choices: string[];
  correctAnswerIndex: number;
  correctAnswerText: string;
  explanation: string;
}

export function buildCreateQuestionPayload(variables: CreateQuestionVariables) {
  const {
    difficulty,
    questionType,
    questionText,
    choices,
    explanation,
    correctAnswerIndex,
    correctAnswerText,
  } = variables;

  let correctAnswerPayload: Record<string, unknown> = {};

  switch (questionType) {
    case "multiple_choice_questions":
      correctAnswerPayload = {
        mcq_correct_choice_position: correctAnswerIndex + 1,
      };
      break;
    case "true_false":
      correctAnswerPayload = {
        tf_correct_choice: correctAnswerIndex === 0,
      };
      break;
    case "short_question":
      correctAnswerPayload = {
        sq_model_answer: correctAnswerText,
      };
      break;
    case "fill_in_the_blanks":
      correctAnswerPayload = {
        fib_accepted_answers: correctAnswerText
          .split(",")
          .map((s: string) => s.trim()),
        fib_case_sensitive: false,
      };
      break;
  }

  return {
    question: {
      difficulty,
      question_type: questionType,
      question: questionText,
    },
    choices: choices.map((c, idx) => ({
      choice_text: c.trim(),
      position: idx + 1,
    })),
    answer: {
      ...correctAnswerPayload,
      explanation,
    },
  };
}
