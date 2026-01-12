import { Minus, Plus } from "lucide-react";
import useQGStore from "./Store";

function QuestionQuantitySelect() {
  const quantity = useQGStore((s) => s.questionQuantity);
  const setQuantity = useQGStore((s) => s.setQuestionQuantity);

  const inc = () => setQuantity(Math.min(30, quantity + 5));
  const dec = () => setQuantity(Math.max(5, quantity - 5));

  return (
    <div className="flex flex-col gap-2 items-center">
      <span className="text-lg text-muted-foreground">
        How many questions do you want ?
      </span>
      <div className="flex gap-1 flex-wrap items-center">
        {Array.from({ length: 6 }, (_, i) => (i + 1) * 5).map((n) => (
          <span
            key={n}
            className={
              "px-2 py-1 rounded-full text-xs border " +
              (n === quantity
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-transparent")
            }
          >
            {n}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-transparent text-sm shadow-xs hover:bg-accent hover:text-accent-foreground"
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <div className="min-w-12 text-center font-medium">{quantity}</div>
        <button
          type="button"
          onClick={inc}
          className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-transparent text-sm shadow-xs hover:bg-accent hover:text-accent-foreground"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
export default QuestionQuantitySelect;
