import { create } from "zustand";
import { questionTypes } from "@/features/question_generation/QuestionTypeSelect";
import type { TSelectData } from "@/components/ui/select_21stdev";
import type { TTag } from "@/components/ui/multiple-select";

//  dependency : last should be "mixed"
export const difficultyTypes: TSelectData[] = [
  {
    id: "1",
    label: "Easy",
    value: "easy",
    description: "Single Concept, Direct Recall, No Distractor Traps",
    icon: "😊",
  },

  {
    id: "2",
    label: "Medium",
    value: "medium",
    description: "Concepts, Application, Mild Distractor Traps",
    icon: "😐",
  },
  {
    id: "3",
    label: "Hard",
    value: "hard",
    description:
      " Multi-step Reasoning, Critical Thinking, Strong Distractor Traps",
    icon: "🤔",
  },
  {
    id: "4",
    label: "Mixed",
    value: "mixed",
    description: "A combination of Easy, Medium, and Hard questions",
    icon: "🎲",
  },
];
export const questionQuantities: TSelectData[] = [5, 10, 15, 20, 25, 30].map(
  (n) => ({
    id: n.toString(),
    label: n.toString(),
    value: n.toString(),
  }),
);
type QuestionGenerationStoreType = {
  difficulty: TSelectData;
  setDifficulty: (d: TSelectData) => void;
  questionQuantity: number;
  setQuestionQuantity: (q: number) => void;
  questionTypes: TTag[];
  setQuestionTypes: (t: TTag[]) => void;
  context: string;
  setContext: (c: string) => void;
};

const useQGStore = create<QuestionGenerationStoreType>((set) => ({
  difficulty: difficultyTypes[difficultyTypes.length - 1],
  setDifficulty: (d: TSelectData) => set({ difficulty: d }),
  questionQuantity: 15,
  setQuestionQuantity: (q: number) => set({ questionQuantity: q }),
  questionTypes: [questionTypes[0]],
  setQuestionTypes: (t: TTag[]) => set({ questionTypes: t }),
  context: "Make questions on How Internet Works",
  setContext: (c: string) => set({ context: c }),
}));

export default useQGStore;
