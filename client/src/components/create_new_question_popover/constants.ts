import type { Difficulty, QuestionKind } from "@/types/questions";

export const difficultyLevels: Difficulty[] = ["easy", "medium", "hard"];

export const questionTypes: {
  value: QuestionKind;
  label: string;
  description: string;
}[] = [
  {
    value: "multiple_choice_questions",
    label: "Multiple Choice",
    description: "There will be 4 options and 1 correct answer.",
  },
  {
    value: "true_false",
    label: "True / False",
    description: "There will be 2 options: True and False.",
  },
  {
    value: "short_question",
    label: "Short Question",
    description: "Participant will type a short text as answer.",
  },
  {
    value: "fill_in_the_blanks",
    label: "Fill in the Blank",
    description:
      "There should be a ___ in the question and one correct answer for that.",
  },
];
