export type Difficulty = "easy" | "medium" | "hard";

export type QuestionKind =
  | "multiple_choice_questions"
  | "true_false"
  | "short_question"
  | "fill_in_the_blanks";

// Matches backend ChoiceResponse
export interface ChoiceResponse {
  choice_id: string;
  text: string;
  position: number;
}

// Matches backend AnswerResponse
export interface AnswerResponse {
  explanation: string;
  correct_choice_position?: number;
  correct_choice_id?: string;
  correct_bool?: boolean;
  accepted_answers?: string[];
  case_sensitive?: boolean;
  model_answer?: string;
}

// Matches backend QuestionResponse
export interface BaseQuestion {
  question_id: string;
  answer_id: string;
  type: QuestionKind;
  difficulty: Difficulty;
  text: string;
  answer: AnswerResponse;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice_questions";
  choices: ChoiceResponse[];
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  choices: ChoiceResponse[];
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

export interface SelfTestAnswer {
  mcq_selected_position?: number;
  tf_selected?: boolean;
  fib_answer?: string;
  sq_answer?: string;
}
