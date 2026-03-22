import { create } from "zustand";
import type { SelfTestAnswer } from "@/types/questions";

interface SelfTestAnswersState {
  setId: string | null;
  answers: Record<string, SelfTestAnswer>;
  hydrateAnswers: (setId: string) => void;
  selectAnswer: (questionId: string, answer: SelfTestAnswer) => void;
  clearAnswers: () => void;
}

function answersStorageKey(setId: string) {
  return `self-test:${setId}:answers`;
}

const useSelfTestAnswersStore = create<SelfTestAnswersState>((set, get) => ({
  setId: null,
  answers: {},
  hydrateAnswers: (setId) => {
    const raw = localStorage.getItem(answersStorageKey(setId));
    let parsed: Record<string, SelfTestAnswer> = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw) as Record<string, SelfTestAnswer>;
      } catch {
        parsed = {};
      }
    }
    set({ setId, answers: parsed });
  },
  selectAnswer: (questionId, answer) => {
    set((state) => {
      const nextAnswers = { ...state.answers, [questionId]: answer };
      if (state.setId) {
        localStorage.setItem(answersStorageKey(state.setId), JSON.stringify(nextAnswers));
      }
      return { answers: nextAnswers };
    });
  },
  clearAnswers: () => {
    const currentSetId = get().setId;
    if (currentSetId) {
      localStorage.removeItem(answersStorageKey(currentSetId));
    }
    set({ answers: {} });
  },
}));

export default useSelfTestAnswersStore;
