import { create } from "zustand";

const questionsStore = (set) => ({
  questions: [],
  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
    })),
  removeQuestion: (index) =>
    set((state) => ({
      questions: state.questions.filter((_, i) => i !== index),
    })),
  updateQuestion: (index, newQuestion) =>
    set((state) => ({
      questions: state.questions.map((q, i) => (i === index ? newQuestion : q)),
    })),
  clearQuestions: () => set({ questions: [] }),
});
