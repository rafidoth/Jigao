export type Difficulty = "easy" | "medium" | "hard";

export type QuestionKind =
  | "multiple_choice_questions"
  | "true_false"
  | "short_question"
  | "fill_in_the_blanks";

export interface BaseQuestion {
  id: string;
  type: QuestionKind;
  difficulty: Difficulty;
  text: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice_questions";
  choices: string[]; // exactly 4 in current UI
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  choices: [string, string];
}

export interface ShortQuestion extends BaseQuestion {
  type: "short_question";
}

export interface FillInTheBlanksQuestion extends BaseQuestion {
  type: "fill_in_the_blanks";
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortQuestion
  | FillInTheBlanksQuestion;

export type QuestionMap = Record<string, Question>;
