import useQGStore from "@/features/question_generation/Store";
import DifficultySelect from "@/features/question_generation/DifficultySelect";
import QuestionQuantitySelect from "@/features/question_generation/QuestionQuantitySelect";
import QuestionTypeSelect from "@/features/question_generation/QuestionTypeSelect";
import ContextInput from "@/features/question_generation/ContextInput";

function NewSet() {
  const difficulty = useQGStore((state) => state.difficulty);
  const questionQuantity = useQGStore((state) => state.questionQuantity);
  const questionTypes = useQGStore((state) => state.questionTypes);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-2">
      <div className="text-2xl  md:text-5xl font-bold">Generate Question</div>
      <div className="flex flex-col md:w[700px]  md:flex-row md:justify-center gap-5 items-start mt-4 mb-8">
        <div className="w-full flex flex-col gap-4 items-center ">
          <DifficultySelect />
          <QuestionQuantitySelect />
        </div>
        <QuestionTypeSelect />
      </div>
      <div className="md:w-[600px] h-[150px] ">
        <ContextInput />
      </div>
    </div>
  );
}

export default NewSet;
