import type { Question } from "@/types/questions";

type AnswerEntry = {
  answer: string | number | boolean | null;
  is_correct: boolean;
  correct_answer: string;
};

function MultipleChoiceResult({
  question,
  userAns,
  isCorrect,
}: {
  question: Question;
  userAns: string | number | boolean | null;
  isCorrect: boolean;
}) {
  if (question.type !== "multiple_choice_questions" || !question.choices) return null;

  return (
    <div className="space-y-2">
      {question.choices.map((choice) => {
        const isUserAnswer = userAns === choice.choice_id;
        const isCorrectAnswer =
          choice.position === question.answer?.correct_choice_position;

        return (
          <div
            key={choice.choice_id}
            className={`p-2 rounded-md border transition-colors ${
              isCorrectAnswer
                ? "bg-green-950/30 border-green-700/50 text-green-200"
                : isUserAnswer
                  ? "bg-red-950/30 border-red-700/50 text-red-200"
                  : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <span className="text-xs">{choice.text}</span>
            {isCorrectAnswer && (
              <span className="ml-2 text-xs font-semibold text-green-300">Correct</span>
            )}
            {isUserAnswer && !isCorrect && (
              <span className="ml-2 text-xs font-semibold text-red-300">Your answer</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrueFalseResult({
  question,
  userAns,
  isCorrect,
}: {
  question: Question;
  userAns: string | number | boolean | null;
  isCorrect: boolean;
}) {
  if (question.type !== "true_false") return null;

  return (
    <div className="space-y-2">
      {["True", "False"].map((choiceText) => {
        const choiceId = choiceText.toLowerCase();
        const isUserAnswer = userAns === choiceId;
        const isCorrectAnswer =
          question.answer?.correct_bool !== undefined
            ? (question.answer.correct_bool === true && choiceText === "True") ||
              (question.answer.correct_bool === false && choiceText === "False")
            : false;

        return (
          <div
            key={choiceId}
            className={`p-2 rounded-md border transition-colors ${
              isCorrectAnswer
                ? "bg-green-950/30 border-green-700/50 text-green-200"
                : isUserAnswer
                  ? "bg-red-950/30 border-red-700/50 text-red-200"
                  : "bg-muted border-border text-muted-foreground"
            }`}
          >
            <span className="text-xs">{choiceText}</span>
            {isCorrectAnswer && (
              <span className="ml-2 text-xs font-semibold text-green-300">Correct</span>
            )}
            {isUserAnswer && !isCorrect && (
              <span className="ml-2 text-xs font-semibold text-red-300">Your answer</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShortQuestionResult({
  question,
  userAns,
}: {
  question: Question;
  userAns: string | number | boolean | null;
}) {
  if (question.type !== "short_question") return null;

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

function FillInTheBlanksResult({
  question,
  userAns,
  isCorrect,
}: {
  question: Question;
  userAns: string | number | boolean | null;
  isCorrect: boolean;
}) {
  if (question.type !== "fill_in_the_blanks") return null;

  return (
    <div className="space-y-2">
      {userAns && (
        <div
          className={`p-2 rounded-md border ${
            isCorrect
              ? "bg-green-950/30 border-green-700/50 text-green-200"
              : "bg-red-950/30 border-red-700/50 text-red-200"
          }`}
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

export function QuestionResultCard({
  question,
  answer,
}: {
  question: Question;
  answer?: AnswerEntry;
}) {
  const isCorrect = answer?.is_correct === true;
  const userAns = answer?.answer ?? null;

  return (
    <div
      className={`rounded-xl border-none p-4 transition-colors ${
        isCorrect ? "bg-green-950/30" : "bg-red-950/30"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {question.difficulty}
        </span>
        <span
          className={`text-xs font-semibold ${
            isCorrect ? "text-green-400" : "text-red-400"
          }`}
        >
          {isCorrect ? "Correct" : "Incorrect"}
        </span>
      </div>

      <p className="font-medium text-foreground mb-3">{question.text}</p>

      <MultipleChoiceResult question={question} userAns={userAns} isCorrect={isCorrect} />
      <TrueFalseResult question={question} userAns={userAns} isCorrect={isCorrect} />
      <ShortQuestionResult question={question} userAns={userAns} />
      <FillInTheBlanksResult
        question={question}
        userAns={userAns}
        isCorrect={isCorrect}
      />

      {question.answer?.explanation && (
        <div className="mt-4 p-3 bg-secondary/10 rounded-md">
          <span className="font-semibold">Explanation:</span>
          <p className="text-xs mt-1">{question.answer.explanation}</p>
        </div>
      )}
    </div>
  );
}
