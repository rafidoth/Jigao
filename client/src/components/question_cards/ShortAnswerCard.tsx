import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ShortQuestion } from "@/types/questions";
import { typeLabel } from "./CardUtils";

interface Props {
  question: ShortQuestion;
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

export default function ShortAnswerCard({
  question: q,
  showAnswer,
  position,
  selected,
  selectAnswer,
}: Props) {
  const modelAnswer = q.answer?.model_answer;

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
        <Textarea
          className="text-sm"
          placeholder="Write your answer..."
          value={selected}
          onChange={(e) => selectAnswer(q.question_id, e.target.value)}
        />
        {showAnswer && (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm">Model Answer</p>
            <Card className="p-3 text-sm text-muted-foreground">
              {modelAnswer || "No answer provided."}
            </Card>
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
