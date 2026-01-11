import { create } from "zustand";
import type { TSelectData } from "@/components/ui/select_21stdev";

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
export const questionQuantities: TSelectData[] = Array.from(
  { length: 30 },
  (_: any, i: number) => ({
    id: (i + 1).toString(),
    label: (i + 1).toString(),
    value: (i + 1).toString(),
  }),
);

type QuestionGenerationStoreType = {
  difficulty: TSelectData;
  setDifficulty: (d: TSelectData) => void;
  questionQuantity: number;
  setQuestionQuantity: (q: number) => void;
};

const useQGStore = create<QuestionGenerationStoreType>((set) => ({
  difficulty: difficultyTypes[difficultyTypes.length - 1],
  setDifficulty: (d: TSelectData) => set({ difficulty: d }),
  questionQuantity: 15,
  setQuestionQuantity: (q: number) => set({ questionQuantity: q }),
}));

export default useQGStore;
