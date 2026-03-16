import { useState } from "react";
import { create } from "zustand";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { Difficulty, QuestionKind } from "@/types/questions";

// Difficulty levels supported in UI
const difficultyLevels: Difficulty[] = ["easy", "medium", "hard"];

// Question type metadata used for selection UI
const questionTypes: {
  value: QuestionKind;
  label: string;
  description: string;
}[] = [
  {
    value: "multiple_choice_questions",
    label: "Multiple Choice",
    description: "There will be 4 options and 1 correct answer.",
  },
  {
    value: "true_false",
    label: "True / False",
    description: "There will be 2 options: True and False.",
  },
  {
    value: "short_question",
    label: "Short Question",
    description: "Participant will type a short text as answer.",
  },
  {
    value: "fill_in_the_blanks",
    label: "Fill in the Blank",
    description:
      "There should be a ___ in the question and one correct answer for that.",
  },
];

interface CreateNewQuestionStoreState {
  reset: () => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;

  questionText: string;
  setQuestionText: (t: string) => void;

  questionType: QuestionKind;
  setQuestionType: (t: QuestionKind) => void;

  mcq: { choices: string[]; correctAnswer: number };
  setChoice: (index: number, value: string) => void;
  setMcqCorrectAnswer: (index: number) => void;

  trueFalse: { choices: [string, string]; correctAnswer: number };
  setTrueFalseCorrectAnswer: (index: number) => void;

  fillInTheBlanks: { correctAnswers: string[] };
  addFillInTheBlanksAnswer: (answer: string) => void;

  shortAnswer: { estimatedCorrectAnswer: string };
  setShortAnswerEstimatedCorrectAnswer: (t: string) => void;

  answerExplanation: string;
  setAnswerExplanation: (t: string) => void;
}

const CreateNewQuestionStore = (
  set: any,
  _get: any,
  store: any,
): CreateNewQuestionStoreState => ({
  reset: () => set(store.getInitialState()),
  difficulty: "easy",
  setDifficulty: (d) => set({ difficulty: d }),

  questionText: "",
  setQuestionText: (t) => set({ questionText: t }),

  questionType: "multiple_choice_questions",
  setQuestionType: (t) => set({ questionType: t }),

  mcq: {
    choices: ["", "", "", ""],
    correctAnswer: Math.floor(Math.random() * 4),
  },
  setChoice: (index, value) =>
    set((state: CreateNewQuestionStoreState) => {
      const newChoices = [...state.mcq.choices];
      newChoices[index] = value;
      return { mcq: { ...state.mcq, choices: newChoices } };
    }),
  setMcqCorrectAnswer: (index) =>
    set((state: CreateNewQuestionStoreState) => ({
      mcq: { ...state.mcq, correctAnswer: index },
    })),

  trueFalse: {
    choices: ["True", "False"],
    correctAnswer: Math.floor(Math.random() * 2),
  },
  setTrueFalseCorrectAnswer: (index) =>
    set((state: CreateNewQuestionStoreState) => ({
      trueFalse: { ...state.trueFalse, correctAnswer: index },
    })),

  fillInTheBlanks: { correctAnswers: [] },
  addFillInTheBlanksAnswer: (answer) =>
    set((state: CreateNewQuestionStoreState) => ({
      fillInTheBlanks: {
        correctAnswers: [...state.fillInTheBlanks.correctAnswers, answer],
      },
    })),

  shortAnswer: { estimatedCorrectAnswer: "" },
  setShortAnswerEstimatedCorrectAnswer: (t) =>
    set((state: CreateNewQuestionStoreState) => ({
      shortAnswer: { ...state.shortAnswer, estimatedCorrectAnswer: t },
    })),

  answerExplanation: "",
  setAnswerExplanation: (t) => set({ answerExplanation: t }),
});

const useCreateNewQuestionStore = create<CreateNewQuestionStoreState>(
  CreateNewQuestionStore,
);

function DifficultySelector() {
  const difficulty = useCreateNewQuestionStore((s) => s.difficulty);
  const setDifficulty = useCreateNewQuestionStore((s) => s.setDifficulty);
  return (
    <div className="flex gap-2 flex-wrap">
      {difficultyLevels.map((level) => {
        const active = difficulty === level;
        return (
          <Button
            key={level}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => setDifficulty(level)}
            className="flex items-center gap-2"
          >
            <Badge
              variant={active ? "secondary" : "outline"}
              className={
                level === "easy"
                  ? "bg-emerald-600 text-emerald-50 dark:bg-emerald-600/80"
                  : level === "medium"
                    ? "bg-amber-500 text-amber-950 dark:bg-amber-500/90"
                    : level === "hard"
                      ? "bg-rose-600 text-rose-50 dark:bg-rose-600/80"
                      : ""
              }
            >
              {level[0].toUpperCase()}
            </Badge>
            <span className="capitalize text-xs">{level}</span>
          </Button>
        );
      })}
    </div>
  );
}

function QuestionTypeSelector() {
  const questionType = useCreateNewQuestionStore((s) => s.questionType);
  const setQuestionType = useCreateNewQuestionStore((s) => s.setQuestionType);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {questionTypes.map((qt) => {
        const active = qt.value === questionType;
        return (
          <Card
            key={qt.value}
            className={` flex flex-col p-3 border cursor-pointer transition ${active ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
            onClick={() => setQuestionType(qt.value)}
          >
            <p className="font-medium text-base">{qt.label}</p>
            <p className=" text-muted-foreground mt-1 leading-relaxed">
              {qt.description}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

function MCQInputs() {
  const choices = useCreateNewQuestionStore((s) => s.mcq.choices);
  const correctAnswer = useCreateNewQuestionStore((s) => s.mcq.correctAnswer);
  const setChoice = useCreateNewQuestionStore((s) => s.setChoice);
  const setCorrect = useCreateNewQuestionStore((s) => s.setMcqCorrectAnswer);
  const questionText = useCreateNewQuestionStore((s) => s.questionText);
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);
  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter question text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {choices.map((c, i) => {
          const active = correctAnswer === i;
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex gap-2 items-center">
                <Button
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setCorrect(i)}
                  className="w-10 justify-center"
                >
                  C{i + 1}
                </Button>
                <Input
                  placeholder={`Choice ${i + 1}`}
                  value={c}
                  onChange={(e) => setChoice(i, e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrueFalseInputs() {
  const choices = useCreateNewQuestionStore((s) => s.trueFalse.choices);
  const correctAnswer = useCreateNewQuestionStore(
    (s) => s.trueFalse.correctAnswer,
  );
  const setTrueFalseCorrectAnswer = useCreateNewQuestionStore(
    (s) => s.setTrueFalseCorrectAnswer,
  );
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);
  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter the statement"
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {choices.map((choice, index) => {
          const active = correctAnswer === index;
          return (
            <div key={index} className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => setTrueFalseCorrectAnswer(index)}
                className="w-full"
              >
                {choice}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FillInTheBlanksInputs() {
  const correctAnswers = useCreateNewQuestionStore(
    (s) => s.fillInTheBlanks.correctAnswers,
  );
  const addAnswer = useCreateNewQuestionStore(
    (s) => s.addFillInTheBlanksAnswer,
  );
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);
  const [current, setCurrent] = useState("");
  const [error, setError] = useState("");

  const handleAddAnswer = () => {
    if (current.trim() === "") {
      setError("Answer cannot be empty");
      return;
    }
    if (correctAnswers.includes(current.trim())) {
      setError("Answer already exists");
      return;
    }
    if (correctAnswers.length >= 8) {
      setError("Maximum of 8 answers allowed");
      return;
    }
    addAnswer(current.trim());
    setCurrent("");
    setError("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAnswer();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter the statement"
        onChange={(e) => setQuestionText(e.target.value)}
      />
      {correctAnswers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {correctAnswers.map((ans, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {ans}
            </Badge>
          ))}
        </div>
      )}
      <Input
        placeholder="Add a correct answer"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" onClick={handleAddAnswer}>
          Add Answer (Enter)
        </Button>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    </div>
  );
}

function ShortAnswerInputs() {
  const estimatedCorrectAnswer = useCreateNewQuestionStore(
    (s) => s.shortAnswer.estimatedCorrectAnswer,
  );
  const questionText = useCreateNewQuestionStore((s) => s.questionText);
  const setQuestionText = useCreateNewQuestionStore((s) => s.setQuestionText);
  const setShortAnswerEstimatedCorrectAnswer = useCreateNewQuestionStore(
    (s) => s.setShortAnswerEstimatedCorrectAnswer,
  );
  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter question text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <Textarea
        placeholder="Enter the estimated correct answer"
        value={estimatedCorrectAnswer}
        onChange={(e) => setShortAnswerEstimatedCorrectAnswer(e.target.value)}
      />
    </div>
  );
}

function getChoicesBasedOnQuestionType(
  questionType: QuestionKind,
  state: CreateNewQuestionStoreState,
) {
  switch (questionType) {
    case "multiple_choice_questions":
      return state.mcq.choices;
    case "true_false":
      return state.trueFalse.choices;
    case "short_question":
      return [];
    case "fill_in_the_blanks":
      return state.fillInTheBlanks.correctAnswers;
    default:
      return [];
  }
}

function getCorrectAnswerBasedOnQuestionType(
  questionType: QuestionKind,
  state: CreateNewQuestionStoreState,
) {
  switch (questionType) {
    case "multiple_choice_questions":
      return state.mcq.choices[state.mcq.correctAnswer];
    case "true_false":
      return state.trueFalse.choices[state.trueFalse.correctAnswer];
    case "short_question":
      return state.shortAnswer.estimatedCorrectAnswer;
    case "fill_in_the_blanks":
      return state.fillInTheBlanks.correctAnswers.join(",");
    default:
      return "";
  }
}

function validateInputs(
  questionType: QuestionKind,
  questionText: string,
  choices: string[],
  correctAnswer: string,
) {
  let error = "";
  if (!questionText || questionText.trim() === "") {
    error = "Question text cannot be empty";
  }
  if (questionType === "multiple_choice_questions") {
    if (choices.length < 4 || choices.some((c) => c.trim() === "")) {
      error = "All 4 choices must be filled out";
    }
    if (!correctAnswer || correctAnswer.trim() === "") {
      error = "A correct answer must be selected";
    }
  }
  if (questionType === "true_false") {
    if (!correctAnswer || correctAnswer.trim() === "") {
      error = "A correct answer must be selected";
    }
  }
  if (questionType === "fill_in_the_blanks") {
    if (choices.length === 0) {
      error = "At least one correct answer must be added";
    }
  }
  const isError = error !== "";
  return { error, isError };
}

interface CreateQuestionVariables {
  set_id: string;
  difficulty: Difficulty;
  questionType: QuestionKind;
  questionText: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
}

async function createNewQuestionApiPost(variables: CreateQuestionVariables) {
  const {
    set_id,
    difficulty,
    questionType,
    questionText,
    choices,
    correctAnswer,
    explanation,
  } = variables;
  const body = {
    question: {
      difficulty: difficulty,
      question_type: questionType,
      question: questionText,
    },
    choices: choices.map((c) => ({ choice_text: c.trim() })),
    answer: {
      answer: correctAnswer,
      explanation: explanation,
    },
  };
  const res = await axios.post(`/api/v1/questions?set_id=${set_id}`, body);
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
  const correctAnswer = getCorrectAnswerBasedOnQuestionType(
    questionType,
    state,
  );
  const explanation = useCreateNewQuestionStore((s) => s.answerExplanation);
  const setExplanation = useCreateNewQuestionStore(
    (s) => s.setAnswerExplanation,
  );
  const [error, setError] = useState("");

  let inputs: React.ReactNode = null;
  switch (questionType) {
    case "multiple_choice_questions":
      inputs = <MCQInputs />;
      break;
    case "true_false":
      inputs = <TrueFalseInputs />;
      break;
    case "short_question":
      inputs = <ShortAnswerInputs />;
      break;
    case "fill_in_the_blanks":
      inputs = <FillInTheBlanksInputs />;
      break;
    default:
      break;
  }

  const resetStates = useCreateNewQuestionStore((s) => s.reset);
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
    const { error, isError } = validateInputs(
      questionType,
      questionText,
      choices,
      correctAnswer,
    );
    if (isError) {
      setError(error);
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
        correctAnswer,
        explanation,
      });
    } catch {}
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[620px] p-4 space-y-4">
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Create New Question</h3>
          <QuestionTypeSelector />
          {inputs}
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
