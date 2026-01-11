import DifficultySelect from "@/features/question_generation/DifficultySelect";
import useQGStore from "@/features/question_generation/Store";

function NewSet() {
  const difficulty = useQGStore((state) => state.difficulty);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-4">
      <div className="w-11/12 h-5/6 bg-accent/40 rounded-xl p-5">
        <div className="text-2xl font-semibold">Generate Question</div>
        <div className="flex gap-4 mt-4 mb-8">
          <DifficultySelect />
        </div>
        {difficulty.label}
      </div>
    </div>
  );
}

export default NewSet;
