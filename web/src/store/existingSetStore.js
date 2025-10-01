import { create } from "zustand";

const existingSetStore = (set) => ({
  showAnswer: true,
  toggleShowAnswer: () => set((state) => ({ showAnswer: !state.showAnswer })),
});

const useExistingSetStore = create(existingSetStore);

export default useExistingSetStore;
