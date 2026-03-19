import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Difficulty, QuestionKind } from "@/types/questions";
import {
  DifficultySelector,
  QuestionTypeInputs,
  QuestionTypeSelector,
} from "./create_new_question_popover/components";
import { useCreateNewQuestionStore } from "./create_new_question_popover/store";
import {
  buildCreateQuestionPayload,
  getChoicesBasedOnQuestionType,
  getCorrectAnswerIndexBasedOnQuestionType,
  getCorrectAnswerTextBasedOnQuestionType,
  validateInputs,
} from "./create_new_question_popover/utils";

interface CreateQuestionVariables {
  set_id: string;
  difficulty: Difficulty;
  questionType: QuestionKind;
  questionText: string;
  choices: string[];
  correctAnswerIndex: number;
  correctAnswerText: string;
  explanation: string;
}

async function createNewQuestionApiPost(variables: CreateQuestionVariables) {
  const body = buildCreateQuestionPayload(variables);
  const res = await axios.post(`/api/v1/questions?set_id=${variables.set_id}`, body);
  return res.data;
}

export default function CreateNewQuestionPopover({
  children,
  set_id,
}: {
  children: React.ReactNode;
  set_id: string;
}) {
  const difficulty = useCreateNewQuestionStore((s) => s.difficulty);
  const questionType = useCreateNewQuestionStore((s) => s.questionType);
  const questionText = useCreateNewQuestionStore((s) => s.questionText);
  const state = useCreateNewQuestionStore();
  const choices = getChoicesBasedOnQuestionType(questionType, state);
  const correctAnswerIndex = getCorrectAnswerIndexBasedOnQuestionType(
    questionType,
    state,
  );
  const correctAnswerText = getCorrectAnswerTextBasedOnQuestionType(
    questionType,
    state,
  );
  const explanation = useCreateNewQuestionStore((s) => s.answerExplanation);
  const setExplanation = useCreateNewQuestionStore((s) => s.setAnswerExplanation);
  const resetStates = useCreateNewQuestionStore((s) => s.reset);

  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createNewQuestionApiPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", set_id] });
      setError("");
      resetStates();
    },
    onError: () => setError("Failed to create question. Please try again."),
  });

  const handleCreateQuestion = async () => {
    const validationResult = validateInputs(
      questionType,
      questionText,
      choices,
      correctAnswerText,
    );

    if (validationResult.isError) {
      setError(validationResult.error);
      return;
    }

    setError("");
    try {
      await mutateAsync({
        set_id,
        difficulty,
        questionType,
        questionText,
        choices,
        correctAnswerIndex,
        correctAnswerText,
        explanation,
      });
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[620px] p-4 space-y-4">
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Create New Question</h3>
          <QuestionTypeSelector />
          <QuestionTypeInputs />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Difficulty</label>
            <DifficultySelector />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Answer Explanation (optional)
            </label>
            <Textarea
              placeholder="Explain the correct answer for participants"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={handleCreateQuestion} disabled={isPending}>
            {isPending ? "Creating..." : "Create Question"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
