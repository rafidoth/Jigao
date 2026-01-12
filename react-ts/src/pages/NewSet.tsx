import useQGStore from "@/features/question_generation/Store";
import DifficultySelect from "@/features/question_generation/DifficultySelect";
import QuestionQuantitySelect from "@/features/question_generation/QuestionQuantitySelect";
import QuestionTypeSelect from "@/features/question_generation/QuestionTypeSelect";

function NewSet() {
  const difficulty = useQGStore((state) => state.difficulty);
  const questionQuantity = useQGStore((state) => state.questionQuantity);
  const questionTypes = useQGStore((state) => state.questionTypes);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4">
      <div className="w-11/12 h-5/6 bg-accent/40 rounded-xl p-5">
        <div className="text-2xl font-semibold">Generate Question</div>
        <div className="flex flex-wrap gap-4 mt-4 mb-8">
          <DifficultySelect />
          <QuestionQuantitySelect />
          <QuestionTypeSelect />
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold">Preview:</span> {difficulty.label} ·{" "}
          {questionTypes.map((qt) => qt.name).join(", ")} ·{" "}
          {questionQuantity}{" "}
        </div>
      </div>
    </div>
  );
}

export default NewSet;
