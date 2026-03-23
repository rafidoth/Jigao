import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type {
  FillInTheBlanksQuestion,
  MultipleChoiceQuestion,
  Question,
  SelfTestAnswer,
  ShortQuestion,
  TrueFalseQuestion,
} from "@/types/questions";

export type AnswerEntry = {
  answer: string | number | boolean | null;
  is_correct: boolean;
  correct_answer: string;
};

type BaseProps = {
  question: Question;
  position: number;
  className?: string;
};

type PracticeProps = BaseProps & {
  mode: "practice";
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
  showAnswer: boolean;
};

type ExamProps = BaseProps & {
  mode: "exam";
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
};

type SelfTestProps = BaseProps & {
  mode: "self-test";
  selected: SelfTestAnswer;
  selectAnswer: (id: string, ans: SelfTestAnswer) => void;
};

type ResultProps = BaseProps & {
  mode: "result";
  answer?: AnswerEntry;
};

export type QuestionCardProps =
  | PracticeProps
  | ExamProps
  | SelfTestProps
  | ResultProps;

const TRUE_FALSE_CHOICES: Array<{ choice_id: "true" | "false"; text: "True" | "False"; value: boolean }> = [
  { choice_id: "true", text: "True", value: true },
  { choice_id: "false", text: "False", value: false },
];

function typeLabel(t: string) {
  return String(t || "")
    .replaceAll("_", " ")
    .replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

function difficultyClass(d: string) {
  const key = String(d || "").toLowerCase();
  if (key === "easy") {
    return "bg-emerald-600 text-emerald-50 dark:bg-emerald-600/80 dark:text-emerald-50";
  }
  if (key === "medium") {
    return "bg-amber-500 text-amber-950 dark:bg-amber-500/90 dark:text-amber-950";
  }
  if (key === "hard") {
    return "bg-rose-600 text-rose-50 dark:bg-rose-600/80 dark:text-rose-50";
  }
  return "bg-muted text-foreground";
}

function ChoiceButton({
  label,
  text,
  isSelected,
  onClick,
  className,
  trailing,
}: {
  label: string;
  text: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 rounded-md border p-2 text-left transition cursor-pointer",
        isSelected ? "border-primary bg-primary/20" : "hover:bg-muted",
        className,
      )}
    >
      <Badge variant="outline" className="w-7 justify-center">
        {label}
      </Badge>
      <span className="flex-1 text-xs">{text}</span>
      {trailing}
    </button>
  );
}

function CardShell({
  mode,
  question,
  position,
  className,
  children,
  footer,
}: {
  mode: QuestionCardProps["mode"];
  question: Question;
  position: number;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const isPractice = mode === "practice";

  return (
    <Card
      className={cn(
        "p-4",
        isPractice && "min-h-[400px] border-none",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {(mode === "practice" || mode === "result") && (
              <Badge className={cn("text-xs", difficultyClass(question.difficulty))}>
                {typeLabel(question.difficulty)}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {typeLabel(question.type)}
            </Badge>
          </div>
          <p className={cn("font-medium", isPractice ? "text-sm" : "text-base")}>
            {position}. {question.text}
          </p>
        </div>
        {children}
        {footer}
      </div>
    </Card>
  );
}

function renderPracticeMcq(
  q: MultipleChoiceQuestion,
  selected: string,
  selectAnswer: (id: string, ans: string) => void,
  showAnswer: boolean,
) {
  const correctPosition = q.answer?.correct_choice_position;
  return (
    <>
      <div className="flex flex-col gap-2">
        {q.choices?.map((c, idx) => {
          const isAnswer = c.position === correctPosition;
          const isSelected = selected === c.choice_id;
          return (
            <ChoiceButton
              key={c.choice_id}
              label={String.fromCharCode(65 + idx)}
              text={c.text}
              isSelected={isSelected}
              onClick={() => selectAnswer(q.question_id, c.choice_id)}
              className={cn(
                isSelected
                  ? isAnswer
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                    : "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                  : "",
              )}
              trailing={
                showAnswer && isAnswer ? (
                  <Badge variant="default" className="text-xs">
                    Correct
                  </Badge>
                ) : undefined
              }
            />
          );
        })}
      </div>
      {showAnswer && q.answer?.explanation ? (
        <div className="space-y-2">
          <p className="font-semibold text-xs">Explanation</p>
          <Card className="p-3 bg-blue-500/10 text-white">{q.answer.explanation}</Card>
        </div>
      ) : null}
    </>
  );
}

function renderPracticeTrueFalse(
  q: TrueFalseQuestion,
  selected: string,
  selectAnswer: (id: string, ans: string) => void,
  showAnswer: boolean,
) {
  const correctBool = q.answer?.correct_bool;
  return (
    <>
      <div className="flex flex-col gap-2">
        {TRUE_FALSE_CHOICES.map((c, idx) => {
          const isAnswer =
            correctBool !== undefined
              ? (correctBool === true && c.choice_id === "true") ||
                (correctBool === false && c.choice_id === "false")
              : false;
          const isSelected = selected === c.choice_id;

          return (
            <ChoiceButton
              key={c.choice_id}
              label={String.fromCharCode(65 + idx)}
              text={c.text}
              isSelected={isSelected}
              onClick={() => selectAnswer(q.question_id, c.choice_id)}
              className={cn(
                isSelected
                  ? isAnswer
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                    : "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                  : "",
              )}
              trailing={
                showAnswer && isAnswer ? (
                  <Badge variant="default" className="text-xs">
                    Correct
                  </Badge>
                ) : undefined
              }
            />
          );
        })}
      </div>
      {showAnswer && q.answer?.explanation ? (
        <div className="space-y-2">
          <p className="font-semibold text-xs">Explanation</p>
          <Card className="p-3 bg-blue-500/10 text-white">{q.answer.explanation}</Card>
        </div>
      ) : null}
    </>
  );
}

function renderPracticeShort(
  q: ShortQuestion,
  selected: string,
  selectAnswer: (id: string, ans: string) => void,
  showAnswer: boolean,
) {
  return (
    <>
      <Textarea
        className="text-xs"
        placeholder="Write your answer..."
        value={selected}
        onChange={(e) => selectAnswer(q.question_id, e.target.value)}
      />
      {showAnswer && (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-xs">Model Answer</p>
          <Card className="p-3 text-xs text-muted-foreground">
            {q.answer?.model_answer || "No answer provided."}
          </Card>
        </div>
      )}
      {showAnswer && q.answer?.explanation ? (
        <div className="space-y-2">
          <p className="font-semibold text-xs">Explanation</p>
          <Card className="p-3 bg-blue-500/10 text-white">{q.answer.explanation}</Card>
        </div>
      ) : null}
    </>
  );
}

function renderPracticeFib(
  q: FillInTheBlanksQuestion,
  selected: string,
  selectAnswer: (id: string, ans: string) => void,
  showAnswer: boolean,
) {
  const acceptedAnswers = q.answer?.accepted_answers || [];
  const caseSensitive = q.answer?.case_sensitive ?? false;
  const isCorrect = acceptedAnswers.some((ans) =>
    caseSensitive ? ans === selected : ans.toLowerCase() === selected.toLowerCase(),
  );
  const isEmpty = selected === "";

  return (
    <>
      <Input
        className={cn(
          "text-xs",
          isCorrect
            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
            : isEmpty
              ? ""
              : "border-rose-500 bg-rose-50 dark:bg-rose-500/10",
        )}
        placeholder="Write your answer..."
        value={selected}
        onChange={(e) => selectAnswer(q.question_id, e.target.value)}
      />
      {showAnswer && acceptedAnswers.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-xs">Accepted Answers</p>
          <div className="flex flex-col gap-2">
            {acceptedAnswers.map((ans, idx) => (
              <div
                key={`${q.question_id}-answer-${idx}`}
                className="flex items-center gap-2 rounded-md border p-2 bg-green-800/40 border-green-700"
              >
                <Badge variant="default" className="text-xs">
                  Correct
                </Badge>
                <span>{ans}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {showAnswer && q.answer?.explanation ? (
        <div className="space-y-2">
          <p className="font-semibold text-xs">Explanation</p>
          <Card className="p-3 bg-blue-500/10 text-white">{q.answer.explanation}</Card>
        </div>
      ) : null}
    </>
  );
}

function renderStringMcq(
  q: MultipleChoiceQuestion,
  selected: string,
  selectAnswer: (id: string, ans: string) => void,
) {
  return (
    <div className="flex flex-col gap-2">
      {q.choices?.map((c, idx) => (
        <ChoiceButton
          key={c.choice_id}
          label={String.fromCharCode(65 + idx)}
          text={c.text}
          isSelected={selected === c.choice_id}
          onClick={() => selectAnswer(q.question_id, c.choice_id)}
        />
      ))}
    </div>
  );
}

function renderStringTrueFalse(
  q: TrueFalseQuestion,
  selected: string,
  selectAnswer: (id: string, ans: string) => void,
) {
  return (
    <div className="flex flex-col gap-2">
      {TRUE_FALSE_CHOICES.map((c, idx) => (
        <ChoiceButton
          key={c.choice_id}
          label={String.fromCharCode(65 + idx)}
          text={c.text}
          isSelected={selected === c.choice_id}
          onClick={() => selectAnswer(q.question_id, c.choice_id)}
        />
      ))}
    </div>
  );
}

function renderSelfTestMcq(
  q: MultipleChoiceQuestion,
  selected: SelfTestAnswer,
  selectAnswer: (id: string, ans: SelfTestAnswer) => void,
) {
  return (
    <div className="flex flex-col gap-2">
      {q.choices?.map((c, idx) => (
        <ChoiceButton
          key={c.choice_id}
          label={String.fromCharCode(65 + idx)}
          text={c.text}
          isSelected={selected?.mcq_selected_position === c.position}
          onClick={() => selectAnswer(q.question_id, { mcq_selected_position: c.position })}
        />
      ))}
    </div>
  );
}

function renderSelfTestTrueFalse(
  q: TrueFalseQuestion,
  selected: SelfTestAnswer,
  selectAnswer: (id: string, ans: SelfTestAnswer) => void,
) {
  return (
    <div className="flex flex-col gap-2">
      {TRUE_FALSE_CHOICES.map((c, idx) => (
        <ChoiceButton
          key={c.choice_id}
          label={String.fromCharCode(65 + idx)}
          text={c.text}
          isSelected={selected?.tf_selected === c.value}
          onClick={() => selectAnswer(q.question_id, { tf_selected: c.value })}
        />
      ))}
    </div>
  );
}

function ResultListItem({
  text,
  isCorrect,
  isUser,
  isCorrectSubmission,
}: {
  text: string;
  isCorrect: boolean;
  isUser: boolean;
  isCorrectSubmission: boolean;
}) {
  return (
    <div
      className={cn(
        "p-2 rounded-md border transition-colors",
        isCorrect
          ? "bg-green-950/30 border-green-700/50 text-green-200"
          : isUser
            ? "bg-red-950/30 border-red-700/50 text-red-200"
            : "bg-muted border-border text-muted-foreground",
      )}
    >
      <span className="text-xs">{text}</span>
      {isCorrect && <span className="ml-2 text-xs font-semibold text-green-300">Correct</span>}
      {isUser && !isCorrectSubmission && (
        <span className="ml-2 text-xs font-semibold text-red-300">Your answer</span>
      )}
    </div>
  );
}

function renderResultBody(question: Question, userAns: string | number | boolean | null, isCorrect: boolean) {
  if (question.type === "multiple_choice_questions" && question.choices) {
    return (
      <div className="space-y-2">
        {question.choices.map((choice) => {
          const isUserAnswer = userAns === choice.choice_id;
          const isCorrectAnswer = choice.position === question.answer?.correct_choice_position;
          return (
            <ResultListItem
              key={choice.choice_id}
              text={choice.text}
              isCorrect={isCorrectAnswer}
              isUser={isUserAnswer}
              isCorrectSubmission={isCorrect}
            />
          );
        })}
      </div>
    );
  }

  if (question.type === "true_false") {
    return (
      <div className="space-y-2">
        {TRUE_FALSE_CHOICES.map((choice) => {
          const isUserAnswer = userAns === choice.choice_id;
          const isCorrectAnswer =
            question.answer?.correct_bool !== undefined
              ? (question.answer.correct_bool === true && choice.choice_id === "true") ||
                (question.answer.correct_bool === false && choice.choice_id === "false")
              : false;

          return (
            <ResultListItem
              key={choice.choice_id}
              text={choice.text}
              isCorrect={isCorrectAnswer}
              isUser={isUserAnswer}
              isCorrectSubmission={isCorrect}
            />
          );
        })}
      </div>
    );
  }

  if (question.type === "short_question") {
    return (
      <div className="space-y-2">
        {userAns && (
          <div className="p-2 rounded-md border bg-muted border-border">
            <span className="text-xs font-semibold text-muted-foreground">Your answer:</span>
            <p className="text-xs">{String(userAns)}</p>
          </div>
        )}
        {question.answer?.model_answer && (
          <div className="p-2 rounded-md border bg-green-950/30 border-green-700/50 text-green-200">
            <span className="text-xs font-semibold">Model answer:</span>
            <p className="text-xs">{question.answer.model_answer}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {userAns && (
        <div
          className={cn(
            "p-2 rounded-md border",
            isCorrect
              ? "bg-green-950/30 border-green-700/50 text-green-200"
              : "bg-red-950/30 border-red-700/50 text-red-200",
          )}
        >
          <span className="text-xs font-semibold">Your answer:</span>
          <p className="text-xs">{String(userAns)}</p>
        </div>
      )}
      {!!question.answer?.accepted_answers?.length && (
        <div className="p-2 rounded-md border bg-green-950/30 border-green-700/50 text-green-200">
          <span className="text-xs font-semibold">Accepted answers:</span>
          <p className="text-xs">{question.answer.accepted_answers.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

function renderQuestionBody(props: QuestionCardProps) {
  if (props.mode === "practice") {
    const { question, selected, selectAnswer, showAnswer } = props;
    if (question.type === "multiple_choice_questions") {
      return renderPracticeMcq(question, selected, selectAnswer, showAnswer);
    }
    if (question.type === "true_false") {
      return renderPracticeTrueFalse(question, selected, selectAnswer, showAnswer);
    }
    if (question.type === "short_question") {
      return renderPracticeShort(question, selected, selectAnswer, showAnswer);
    }
    return renderPracticeFib(question, selected, selectAnswer, showAnswer);
  }

  if (props.mode === "exam") {
    const { question, selected, selectAnswer } = props;
    if (question.type === "multiple_choice_questions") {
      return renderStringMcq(question, selected, selectAnswer);
    }
    if (question.type === "true_false") {
      return renderStringTrueFalse(question, selected, selectAnswer);
    }
    if (question.type === "short_question") {
      return (
        <Textarea
          placeholder="Write your answer..."
          value={selected}
          onChange={(e) => selectAnswer(question.question_id, e.target.value)}
        />
      );
    }
    return (
      <Input
        placeholder="Write your answer..."
        value={selected}
        onChange={(e) => selectAnswer(question.question_id, e.target.value)}
      />
    );
  }

  if (props.mode === "self-test") {
    const { question, selected, selectAnswer } = props;
    if (question.type === "multiple_choice_questions") {
      return renderSelfTestMcq(question, selected, selectAnswer);
    }
    if (question.type === "true_false") {
      return renderSelfTestTrueFalse(question, selected, selectAnswer);
    }
    if (question.type === "short_question") {
      return (
        <Textarea
          placeholder="Write your answer..."
          value={selected?.sq_answer ?? ""}
          onChange={(e) => selectAnswer(question.question_id, { sq_answer: e.target.value })}
        />
      );
    }
    return (
      <Input
        placeholder="Write your answer..."
        value={selected?.fib_answer ?? ""}
        onChange={(e) => selectAnswer(question.question_id, { fib_answer: e.target.value })}
      />
    );
  }

  const isCorrect = props.answer?.is_correct === true;
  const userAns = props.answer?.answer ?? null;

  return (
    <>
      <div className="flex items-start justify-between mb-1">
        <span className={cn("text-xs font-semibold", isCorrect ? "text-green-400" : "text-red-400")}>
          {isCorrect ? "Correct" : "Incorrect"}
        </span>
      </div>
      {renderResultBody(props.question, userAns, isCorrect)}
      {props.question.answer?.explanation && (
        <div className="mt-4 p-3 bg-secondary/10 rounded-md">
          <span className="font-semibold">Explanation:</span>
          <p className="text-xs mt-1">{props.question.answer.explanation}</p>
        </div>
      )}
    </>
  );
}

export default function QuestionCard(props: QuestionCardProps) {
  const cardMode = props.mode;
  const resultCorrect = props.mode === "result" ? props.answer?.is_correct === true : false;

  return (
    <CardShell
      mode={cardMode}
      question={props.question}
      position={props.position}
      className={cn(
        props.className,
        props.mode === "result" && "rounded-xl border-none transition-colors",
        props.mode === "result" && (resultCorrect ? "bg-green-950/30" : "bg-red-950/30"),
      )}
    >
      {renderQuestionBody(props)}
    </CardShell>
  );
}
