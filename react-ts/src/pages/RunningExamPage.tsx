import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CountdownText } from "./ExamPage";
import { format } from "date-fns";
import { typeLabel } from "@/components/question_cards/CardUtils";
import { Link } from "react-router";
import type {
  Question,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortQuestion,
  FillInTheBlanksQuestion,
} from "@/types/questions";
import { cn } from "@/lib/utils";

interface BaseExamCardProps {
  position: number;
  type: string;
  text: string;
}

interface SelectProps extends BaseExamCardProps {
  question: MultipleChoiceQuestion | TrueFalseQuestion;
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
}

function McqExamCard({
  question: q,
  position,
  selected,
  selectAnswer,
}: SelectProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabel(q.type)}
            </Badge>
          </div>
          <p className="font-medium">
            {position}. {q.text}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {q.choices?.map((c, idx) => {
            const isSelected = selected === c;
            return (
              <button
                key={`${q.id}-choice-${idx}`}
                type="button"
                onClick={() => selectAnswer(q.id, c)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md border p-2 text-left transition",
                  isSelected ? "border-accent bg-accent/30" : "hover:bg-muted",
                )}
              >
                <Badge variant="outline" className="w-7 justify-center">
                  {String.fromCharCode(65 + idx)}
                </Badge>
                <span className="flex-1">{c}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function TrueFalseExamCard({
  question: q,
  position,
  selected,
  selectAnswer,
}: SelectProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabel(q.type)}
            </Badge>
          </div>
          <p className="font-medium">
            {position}. {q.text}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {q.choices?.map((c, idx) => {
            const isSelected = selected === c;
            return (
              <button
                key={`${q.id}-choice-${idx}`}
                type="button"
                onClick={() => selectAnswer(q.id, c)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md border p-2 text-left transition",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted",
                )}
              >
                <Badge variant="outline" className="w-7 justify-center">
                  {String.fromCharCode(65 + idx)}
                </Badge>
                <span className="flex-1">{c}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

interface ShortProps extends BaseExamCardProps {
  question: ShortQuestion;
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
}

function ShortAnswerExamCard({
  question: q,
  position,
  selected,
  selectAnswer,
}: ShortProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabel(q.type)}
            </Badge>
          </div>
          <p className="font-medium">
            {position}. {q.text}
          </p>
        </div>
        <Textarea
          placeholder="Write your answer…"
          value={selected}
          onChange={(e) => selectAnswer(q.id, e.target.value)}
        />
      </div>
    </Card>
  );
}

interface FillProps extends BaseExamCardProps {
  question: FillInTheBlanksQuestion;
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
}

function FillInTheBlanksExamCard({
  question: q,
  position,
  selected,
  selectAnswer,
}: FillProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabel(q.type)}
            </Badge>
          </div>
          <p className="font-medium">
            {position}. {q.text}
          </p>
        </div>
        <Input
          placeholder="Write your answer…"
          value={selected}
          onChange={(e) => selectAnswer(q.id, e.target.value)}
        />
      </div>
    </Card>
  );
}

interface ExamQuestionCardProps {
  question: Question;
  position: number;
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
}

function ExamQuestionCard({
  question: q,
  position,
  selected,
  selectAnswer,
}: ExamQuestionCardProps) {
  switch (q.type) {
    case "multiple_choice_questions":
      return (
        <McqExamCard
          question={q}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
          type={q.type}
          text={q.text}
        />
      );
    case "true_false":
      return (
        <TrueFalseExamCard
          question={q}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
          type={q.type}
          text={q.text}
        />
      );
    case "short_question":
      return (
        <ShortAnswerExamCard
          question={q}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
          type={q.type}
          text={q.text}
        />
      );
    case "fill_in_the_blanks":
      return (
        <FillInTheBlanksExamCard
          question={q}
          position={position}
          selected={selected}
          selectAnswer={selectAnswer}
          type={q.type}
          text={q.text}
        />
      );
  }
}

function RunningExam({
  endTime,
  title,
  questions,
}: {
  endTime: Date;
  title: string;
  questions: Question[];
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const selectAnswer = (id: string, ans: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [id]: ans }));
  };

  return (
    <div className="h-screen w-[800px] flex flex-col gap-4 py-4">
      <div
        className={cn(
          "flex justify-between items-center shrink-0 sticky top-0 z-10   border rounded-md p-4",
        )}
      >
        <div className="flex flex-col">
          <div className="text-3xl">{title || "Exam"} </div>
          <Badge
            variant={"outline"}
            className="font-semibold select-none bg-blue-500/20 text-blue-500"
          >
            Exam in progress
          </Badge>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 py-2">
          <div className="flex gap-x-2 items-center justify-center">
            <div className="text-muted-foreground">Ends in</div>
            <div className="font-mono text-2xl">
              <CountdownText until={endTime} />
            </div>
          </div>
          <div className="border flex gap-x-2 px-2 rounded-md bg-red-800/80 text-red-50 font-semibold">
            <span>{format(endTime, "d MMMM,yyyy")}</span>
            <span>{format(endTime, "p")}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-3 pb-6">
          {questions?.map((q, idx) => (
            <ExamQuestionCard
              key={q.id}
              question={q}
              position={idx + 1}
              selected={selectedAnswers[q.id] || ""}
              selectAnswer={selectAnswer}
            />
          ))}
          <div className="flex justify-center">
            <Badge className="bg-blue-600/20 text-blue-500">
              End of Questions
            </Badge>
          </div>
        </div>
      </div>
      <div className="absolute bottom-5 right-5 flex  gap-x-2 justify-center items-center z-10">
        <img src="/logo.png" className="w-8 h-8 rounded-md" />
        <Link to="/" className="text-3xl">
          Jigao
        </Link>
      </div>
    </div>
  );
}
export default RunningExam;
