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
      <div className="w-11/12 h-5/6  rounded-xl p-5">
        <div className="text-2xl font-semibold">Generate Question</div>
        <div className="flex flex-col md:flex-row gap-7 items-start mt-4 mb-8">
          <div className="flex flex-col gap-4 items-start">
            <DifficultySelect />
            <QuestionQuantitySelect />
          </div>
          <QuestionTypeSelect />
        </div>
      </div>
      <div></div>
    </div>
  );
}

export default NewSet;
