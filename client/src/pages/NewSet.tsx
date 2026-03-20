import useQGStore from "@/features/question_generation/Store";
import DifficultySelect from "@/features/question_generation/DifficultySelect";
import QuestionQuantitySelect from "@/features/question_generation/QuestionQuantitySelect";
import QuestionTypeSelect from "@/features/question_generation/QuestionTypeSelect";
import ContextInput from "@/features/question_generation/ContextInput";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
// import { useMutation } from "@tanstack/react-query";
// import { useNavigate } from "react-router";
// import { generateQuestions } from "@/api/ai_api";

function NewSet() {
    // const difficultyLevel = useQGStore((state) => state.difficulty).value;
    // const questionQuantity = useQGStore((state) => state.questionQuantity);
    // const questionTypes = useQGStore((state) => state.questionTypes);
    // const context = useQGStore((state) => state.context);
    // const navigate = useNavigate();
    //
    // const { mutateAsync, isPending } = useMutation({
    //   mutationFn: generateQuestions,
    //   onSuccess: (data) => {
    //     const { set_id } = data;
    //     navigate(`/sets/${set_id}`);
    //   },
    // });
    //
    // const handleGenerate = async () => {
    //   await mutateAsync({
    //     difficultyLevel,
    //     questionQuantity,
    //     questionTypes: questionTypes.map((qt) => qt.key),
    //     context,
    //   });
    // };
    //
    // if (isPending) {
    //   return (
    //     <div className="flex h-full w-full flex-col items-center justify-center px-2">
    //       <div className="text-sm md:text-3xl font-bold">Generating...</div>
    //     </div>
    //   );
    // }

    return (
        null
    );
}

export default NewSet;
