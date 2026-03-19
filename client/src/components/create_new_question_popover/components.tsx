import { useState } from "react";
import type { KeyboardEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { difficultyLevels, questionTypes } from "./constants";
import { useCreateNewQuestionStore } from "./store";

export function DifficultySelector() {
  const difficulty = useCreateNewQuestionStore((s) => s.difficulty);
  const setDifficulty = useCreateNewQuestionStore((s) => s.setDifficulty);

  return (
    <div className="flex gap-2 flex-wrap">
      {difficultyLevels.map((level) => {
        const active = difficulty === level;
        return (
          <Button
            key={level}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => setDifficulty(level)}
            className="flex items-center gap-2"
          >
            <Badge
              variant={active ? "secondary" : "outline"}
              className={
                level === "easy"
                  ? "bg-emerald-600 text-emerald-50 dark:bg-emerald-600/80"
                  : level === "medium"
                    ? "bg-amber-500 text-amber-950 dark:bg-amber-500/90"
                    : "bg-rose-600 text-rose-50 dark:bg-rose-600/80"
              }
            >
              {level[0].toUpperCase()}
            </Badge>
            <span className="capitalize text-xs">{level}</span>
          </Button>
        );
      })}
    </div>
  );
}

export function QuestionTypeSelector() {
  const questionType = useCreateNewQuestionStore((s) => s.questionType);
  const setQuestionType = useCreateNewQuestionStore((s) => s.setQuestionType);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {questionTypes.map((qt) => {
        const active = qt.value === questionType;
        return (
          <Card
            key={qt.value}
            className={`flex flex-col p-3 border cursor-pointer transition ${active ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
            onClick={() => setQuestionType(qt.value)}
          >
            <p className="font-medium text-base">{qt.label}</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              {qt.description}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

function MCQInputs() {
  const choices = useCreateNewQuestionStore((s) => s.mcq.choices);
  const correctAnswer = useCreateNewQuestionStore((s) => s.mcq.correctAnswer);
  const setChoice = useCreateNewQuestionStore((s) => s.setChoice);
  const setCorrect = useCreateNewQuestionStore((s) => s.setMcqCorrectAnswer);
  const questionText = useCreateNewQuestionStore((s) => s.questionText);
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter question text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {choices.map((c, i) => {
          const active = correctAnswer === i;
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex gap-2 items-center">
                <Button
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setCorrect(i)}
                  className="w-10 justify-center"
                >
                  C{i + 1}
                </Button>
                <Input
                  placeholder={`Choice ${i + 1}`}
                  value={c}
                  onChange={(e) => setChoice(i, e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrueFalseInputs() {
  const choices = useCreateNewQuestionStore((s) => s.trueFalse.choices);
  const correctAnswer = useCreateNewQuestionStore((s) => s.trueFalse.correctAnswer);
  const setTrueFalseCorrectAnswer = useCreateNewQuestionStore(
    (s) => s.setTrueFalseCorrectAnswer,
  );
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter the statement"
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {choices.map((choice, index) => {
          const active = correctAnswer === index;
          return (
            <div key={index} className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => setTrueFalseCorrectAnswer(index)}
                className="w-full"
              >
                {choice}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FillInTheBlanksInputs() {
  const correctAnswers = useCreateNewQuestionStore(
    (s) => s.fillInTheBlanks.correctAnswers,
  );
  const addAnswer = useCreateNewQuestionStore((s) => s.addFillInTheBlanksAnswer);
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);
  const [current, setCurrent] = useState("");
  const [error, setError] = useState("");

  const handleAddAnswer = () => {
    if (current.trim() === "") {
      setError("Answer cannot be empty");
      return;
    }
    if (correctAnswers.includes(current.trim())) {
      setError("Answer already exists");
      return;
    }
    if (correctAnswers.length >= 8) {
      setError("Maximum of 8 answers allowed");
      return;
    }
    addAnswer(current.trim());
    setCurrent("");
    setError("");
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAnswer();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter the statement"
        onChange={(e) => setQuestionText(e.target.value)}
      />
      {correctAnswers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {correctAnswers.map((ans, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {ans}
            </Badge>
          ))}
        </div>
      )}
      <Input
        placeholder="Add a correct answer"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" onClick={handleAddAnswer}>
          Add Answer (Enter)
        </Button>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    </div>
  );
}

function ShortAnswerInputs() {
  const estimatedCorrectAnswer = useCreateNewQuestionStore(
    (s) => s.shortAnswer.estimatedCorrectAnswer,
  );
  const questionText = useCreateNewQuestionStore((s) => s.questionText);
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);
  const setShortAnswerEstimatedCorrectAnswer = useCreateNewQuestionStore(
    (s) => s.setShortAnswerEstimatedCorrectAnswer,
  );

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter question text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <Textarea
        placeholder="Enter the estimated correct answer"
        value={estimatedCorrectAnswer}
        onChange={(e) => setShortAnswerEstimatedCorrectAnswer(e.target.value)}
      />
    </div>
  );
}

const questionTypeInputMap = {
  multiple_choice_questions: MCQInputs,
  true_false: TrueFalseInputs,
  short_question: ShortAnswerInputs,
  fill_in_the_blanks: FillInTheBlanksInputs,
} as const;

export function QuestionTypeInputs() {
  const questionType = useCreateNewQuestionStore((s) => s.questionType);
  const Component = questionTypeInputMap[questionType];
  return <Component />;
}
