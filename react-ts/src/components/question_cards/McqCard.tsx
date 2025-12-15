import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MultipleChoiceQuestion } from "@/types/questions";
import { typeLabel } from "./CardUtils";

interface Props {
  question: MultipleChoiceQuestion;
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

export default function McqCard({
  question: q,
  showAnswer,
  position,
  selected,
  selectAnswer,
}: Props) {
  return (
    <Card className="p-4 min-h-[400px]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", difficultyClass(q.difficulty))}>
              {typeLabel(q.difficulty)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeLabel(q.type)}
            </Badge>
          </div>
          <p>
            {position}. {q.text}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {q.choices?.map((c, idx) => {
            const isAnswer = idx === q.answerIdx;
            const isSelected = selected === c;
            return (
              <button
                key={`${q.id}-choice-${idx}`}
                type="button"
                onClick={() => selectAnswer(q.id, c)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md border p-2 text-left transition",
                  isSelected
                    ? isAnswer
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                    : "hover:bg-muted",
                )}
              >
                <Badge variant="outline" className="w-7 justify-center">
                  {String.fromCharCode(65 + idx)}
                </Badge>
                <span className="flex-1">{c}</span>
                {showAnswer && isAnswer && (
                  <Badge variant="default" className="text-xs">
                    Correct
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
        {showAnswer && q.explanation ? (
          <div className="space-y-2">
            <p className="font-semibold text-sm">Explanation</p>
            <Card className="p-3 bg-blue-500/10 text-white">
              {q.explanation}
            </Card>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
