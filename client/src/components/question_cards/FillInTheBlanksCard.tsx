import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FillInTheBlanksQuestion } from "@/types/questions";
import { typeLabel } from "./CardUtils";

interface Props {
  question: FillInTheBlanksQuestion;
  showAnswer: boolean;
  position: number;
  selected: string;
  selectAnswer: (id: string, ans: string) => void;
}

function difficultyClass(d: string) {
  const key = String(d || "").toLowerCase();
  if (key === "easy")
    return "bg-emerald-600 text-emerald-50 dark:bg-emerald-600/80 dark:text-emerald-50";
  if (key === "medium")
    return "bg-amber-500 text-amber-950 dark:bg-amber-500/90 dark:text-amber-950";
  if (key === "hard")
    return "bg-rose-600 text-rose-50 dark:bg-rose-600/80 dark:text-rose-50";
  return "bg-muted text-foreground";
}

export default function FillInTheBlanksCard({
  question: q,
  showAnswer,
  position,
  selected,
  selectAnswer,
}: Props) {
  const acceptedAnswers = q.answer?.accepted_answers || [];
  const caseSensitive = q.answer?.case_sensitive ?? false;

  const isCorrect = acceptedAnswers.some((ans) =>
    caseSensitive ? ans === selected : ans.toLowerCase() === selected.toLowerCase(),
  );
  const isEmpty = selected === "";

  return (
    <Card className="p-4 min-h-[400px] border-none">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", difficultyClass(q.difficulty))}>
              {typeLabel(q.difficulty)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {typeLabel(q.type)}
            </Badge>
          </div>
          <p className="font-medium text-base">
            {position}. {q.text}
          </p>
        </div>
        <Input
          placeholder="Write your answer..."
          value={selected}
          onChange={(e) => selectAnswer(q.question_id, e.target.value)}
          className={cn(
            "text-sm",
            isCorrect
              ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
              : isEmpty
                ? ""
                : "border-rose-500 bg-rose-50 dark:bg-rose-500/10",
          )}
        />
        {showAnswer && acceptedAnswers.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-sm">Accepted Answers</p>
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
            <p className="font-semibold text-sm">Explanation</p>
            <Card className="p-3 bg-blue-500/10 text-white">
              {q.answer.explanation}
            </Card>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
