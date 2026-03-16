import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrueFalseQuestion } from "@/types/questions";
import { typeLabel } from "./CardUtils";

interface Props {
  question: TrueFalseQuestion;
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

export default function TrueFalseCard({
  question: q,
  showAnswer,
  position,
  selected,
  selectAnswer,
}: Props) {
  // correct_bool: true means "True" is correct, false means "False" is correct
  const correctBool = q.answer?.correct_bool;

  // For true_false, choices are implicit (not returned by backend)
  const trueFalseChoices = [
    { choice_id: "true", text: "True", position: 1 },
    { choice_id: "false", text: "False", position: 2 },
  ];

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
        <div className="flex flex-col gap-2">
          {trueFalseChoices.map((c, idx) => {
            // Determine if this choice is the correct answer
            const isAnswer =
              correctBool !== undefined
                ? (correctBool === true && c.choice_id === "true") ||
                  (correctBool === false && c.choice_id === "false")
                : false;
            const isSelected = selected === c.choice_id;
            return (
              <button
                key={c.choice_id}
                type="button"
                onClick={() => selectAnswer(q.question_id, c.choice_id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md border p-2 text-left transition",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted",
                )}
              >
                {showAnswer && isAnswer ? (
                  <Badge variant="default" className="text-xs">
                    Correct
                  </Badge>
                ) : (
                  <Badge variant="outline" className="w-7 justify-center">
                    {String.fromCharCode(65 + idx)}
                  </Badge>
                )}
                <span className="flex-1 text-sm">{c.text}</span>
              </button>
            );
          })}
        </div>
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
