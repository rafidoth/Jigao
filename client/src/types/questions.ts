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

// Self-test result types
export interface UserAnswerResponse {
  selected_bool?: boolean;
  selected_choice_position?: number;
  selected_choice_id?: string;
  text_answer?: string;
}

export interface SelfTestQuestionResult {
  question_id: string;
  answer_id: string;
  text: string;
  type: QuestionKind;
  difficulty: Difficulty;
  choices?: ChoiceResponse[];
  answer: AnswerResponse;
  user_answer: UserAnswerResponse | null;
  is_correct: boolean | null; // null for short_question (not graded)
}

export interface SelfTestResultData {
  self_test_id: string;
  set_id: string;
  set_title: string;
  duration_in_minutes: number;
  time_taken_seconds: number;
  correct_count: number;
  question_count: number;
  gradable_count: number;
  created_at: string;
  questions: SelfTestQuestionResult[];
}
