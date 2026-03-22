import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { typeLabel } from "@/components/question_cards/CardUtils";
import { cn } from "@/lib/utils";
import type {
  FillInTheBlanksQuestion,
  MultipleChoiceQuestion,
  Question,
  SelfTestAnswer,
  ShortQuestion,
  TrueFalseQuestion,
} from "@/types/questions";

interface SelectProps {
  position: number;
  question: MultipleChoiceQuestion | TrueFalseQuestion;
  selected: SelfTestAnswer;
  selectAnswer: (id: string, ans: SelfTestAnswer) => void;
}

function McqSelfTestCard({
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
            const isSelected = selected?.mcq_selected_position === c.position;
            return (
              <button
                key={c.choice_id}
                type="button"
                onClick={() => selectAnswer(q.question_id, { mcq_selected_position: c.position })}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md border p-2 text-left transition cursor-pointer",
                  isSelected ? "border-primary bg-primary/30" : "hover:bg-muted"
                )}
              >
                <Badge variant="outline" className="w-7 justify-center">
                  {String.fromCharCode(65 + idx)}
                </Badge>
                <span className="flex-1">{c.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function TrueFalseSelfTestCard({
  question: q,
  position,
  selected,
  selectAnswer,
}: SelectProps) {
  const trueFalseChoices = [
    { choice_id: "true", text: "True", value: true },
    { choice_id: "false", text: "False", value: false },
  ];

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
          {trueFalseChoices.map((c, idx) => {
            const isSelected = selected?.tf_selected === c.value;
            return (
              <button
                key={c.choice_id}
                type="button"
                onClick={() => selectAnswer(q.question_id, { tf_selected: c.value })}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md border p-2 text-left transition cursor-pointer",
                  isSelected ? "border-primary bg-primary/10" : "hover:bg-muted"
                )}
              >
                <Badge variant="outline" className="w-7 justify-center">
                  {String.fromCharCode(65 + idx)}
                </Badge>
                <span className="flex-1">{c.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

interface ShortProps {
  position: number;
  question: ShortQuestion;
  selected: SelfTestAnswer;
  selectAnswer: (id: string, ans: SelfTestAnswer) => void;
}

function ShortAnswerSelfTestCard({
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
          placeholder="Write your answer..."
          value={selected?.sq_answer ?? ""}
          onChange={(e) => selectAnswer(q.question_id, { sq_answer: e.target.value })}
        />
      </div>
    </Card>
  );
}

interface FillProps {
  position: number;
  question: FillInTheBlanksQuestion;
  selected: SelfTestAnswer;
  selectAnswer: (id: string, ans: SelfTestAnswer) => void;
}

function FillInTheBlanksSelfTestCard({
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
          placeholder="Write your answer..."
          value={selected?.fib_answer ?? ""}
          onChange={(e) => selectAnswer(q.question_id, { fib_answer: e.target.value })}
        />
      </div>
    </Card>
  );
}

interface SelfTestQuestionCardProps {
  question: Question;
  position: number;
  selected: SelfTestAnswer;
  selectAnswer: (id: string, ans: SelfTestAnswer) => void;
}

export function SelfTestQuestionCard({
  question,
  position,
  selected,
  selectAnswer,
}: SelfTestQuestionCardProps) {
  if (question.type === "multiple_choice_questions") {
    return (
      <McqSelfTestCard
        question={question}
        position={position}
        selected={selected}
        selectAnswer={selectAnswer}
      />
    );
  }

  if (question.type === "true_false") {
    return (
      <TrueFalseSelfTestCard
        question={question}
        position={position}
        selected={selected}
        selectAnswer={selectAnswer}
      />
    );
  }

  if (question.type === "short_question") {
    return (
      <ShortAnswerSelfTestCard
        question={question}
        position={position}
        selected={selected}
        selectAnswer={selectAnswer}
      />
    );
  }

  return (
    <FillInTheBlanksSelfTestCard
      question={question}
      position={position}
      selected={selected}
      selectAnswer={selectAnswer}
    />
  );
}
