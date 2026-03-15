import { create } from "zustand";

// TODO: Replace 'any' with the discriminated Question union when cards are converted.
import type { Question } from "@/types/questions";
export interface QuestionsState {
  questions: Question[];
  addQuestion: (question: Question) => void;
  removeQuestion: (index: number) => void;
  updateQuestion: (index: number, newQuestion: Question) => void;
  clearQuestions: () => void;
}

const questionsStore = (
  set: (fn: (state: QuestionsState) => Partial<QuestionsState>) => void,
): QuestionsState => ({
  questions: [],
  addQuestion: (question) =>
    set((state) => ({ questions: [...state.questions, question] })),
  removeQuestion: (index) =>
    set((state) => ({ questions: state.questions.filter((_, i) => i !== index) })),
  updateQuestion: (index, newQuestion) =>
    set((state) => ({
      questions: state.questions.map((q, i) => (i === index ? newQuestion : q)),
    })),
  clearQuestions: () => set(() => ({ questions: [] })),
});

const useQuestionsStore = create<QuestionsState>(questionsStore);
export default useQuestionsStore;
