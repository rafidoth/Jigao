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
  explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice_questions";
  choices: string[]; // exactly 4 in current UI
  answerIdx: number; // index into choices
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  choices: [string, string]; // ["True", "False"] typically
  answerIdx: number; // 0 or 1
}

export interface ShortQuestion extends BaseQuestion {
  type: "short_question";
  answerText?: string; // estimated answer shown when reveal is on
}

export interface FillInTheBlanksQuestion extends BaseQuestion {
  type: "fill_in_the_blanks";
  choices: string[]; // list of acceptable answers
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortQuestion
  | FillInTheBlanksQuestion;

export type QuestionMap = Record<string, Question>;
