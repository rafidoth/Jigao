import useQGStore from "@/features/question_generation/Store";
import DifficultySelect from "@/features/question_generation/DifficultySelect";
import QuestionQuantitySelect from "@/features/question_generation/QuestionQuantitySelect";
import QuestionTypeSelect from "@/features/question_generation/QuestionTypeSelect";
import ContextInput from "@/features/question_generation/ContextInput";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { generateQuestions } from "@/api/ai_api";

function NewSet() {
  const difficultyLevel = useQGStore((state) => state.difficulty).value;
  const questionQuantity = useQGStore((state) => state.questionQuantity);
  const questionTypes = useQGStore((state) => state.questionTypes);
  const context = useQGStore((state) => state.context);
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: generateQuestions,
    onSuccess: (data) => {
      const { set_id } = data;
      navigate(`/sets/${set_id}`);
    },
  });

  const handleGenerate = async () => {
    await mutateAsync({
      difficultyLevel,
      questionQuantity,
      questionTypes: questionTypes.map((qt) => qt.key),
      context,
    });
  };

  if (isPending) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-2">
        <div className="text-xl md:text-3xl font-bold">Generating...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-2">
      <div className="text-xl  md:text-3xl font-bold">Generate Question</div>
      <div className="flex flex-col md:w[700px]  md:flex-row md:justify-center gap-5 items-start mt-4 mb-8">
        <div className="w-full flex flex-col gap-4 items-center ">
          <DifficultySelect />
          <QuestionQuantitySelect />
        </div>
        <QuestionTypeSelect />
      </div>
      <div className="md:w-[700px] h-[150px] relative">
        <ContextInput />
        <Button
          className="rounded-full w-8 h-8 absolute bottom-4 right-4 flex items-center justify-center p-0"
          onClick={handleGenerate}
        >
          <Send />
        </Button>
      </div>
    </div>
  );
}

export default NewSet;
