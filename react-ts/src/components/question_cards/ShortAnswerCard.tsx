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
  if (key === "easy") return "bg-emerald-600 text-emerald-50 dark:bg-emerald-600/80 dark:text-emerald-50";
  if (key === "medium") return "bg-amber-500 text-amber-950 dark:bg-amber-500/90 dark:text-amber-950";
  if (key === "hard") return "bg-rose-600 text-rose-50 dark:bg-rose-600/80 dark:text-rose-50";
  return "bg-muted text-foreground";
}

export default function ShortAnswerCard({ question: q, showAnswer, position, selected, selectAnswer }: Props) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", difficultyClass(q.difficulty))}>{typeLabel(q.difficulty)}</Badge>
            <Badge variant="secondary" className="text-xs">{typeLabel(q.type)}</Badge>
          </div>
          <p className="font-medium">{position}. {q.text}</p>
        </div>
        <Textarea
          placeholder="Write your answer…"
          value={selected}
          onChange={(e) => selectAnswer(q.id, e.target.value)}
        />
        {q.type === "short_question" && showAnswer && (
          <div className="flex flex-col gap-2">
            <Card className="p-3 text-sm text-muted-foreground">{q.answerText || "No answer provided."}</Card>
          </div>
        )}
      </div>
    </Card>
  );
}
